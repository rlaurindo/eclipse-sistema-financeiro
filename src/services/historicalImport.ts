import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase.ts';
import { getOrganizationId } from './supabaseData.ts';

export interface ImportLine { name: string; amount: number; category: string; notes?: string; }
export interface ImportRevenue { client: string; amount: number; }
export interface ImportPeriod { key: string; name: string; year: number; month: number; revenues: ImportRevenue[]; expenses: ImportLine[]; sourceSheet: string; }
export interface ImportPreview { periods: ImportPeriod[]; ignoredSheets: string[]; warnings: string[]; }
export interface ImportProgress { completed: number; total: number; label: string; }

const monthNames = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/�/g, '').trim().toUpperCase();
const asAmount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const isTotal = (label: string) => /^(TOTAL|VALOR EM CONTA|SALDO|DIFERENCA|LUCRO|FATURAMENTO BRUTO)/.test(label);

function detectPeriod(text: string, fallbackYear = 2025): { year: number; month: number } | null {
  const clean = normalize(text);
  const year = Number(clean.match(/20\d{2}/)?.[0] || fallbackYear);
  const expenseMonth = clean.match(/GASTOS?\s+(?:DE|DO)\s+([A-Z]+)/)?.[1];
  const mentionedMonths = monthNames
    .map((month, index) => ({ index, position: clean.lastIndexOf(normalize(month)) }))
    .filter(({ position }) => position >= 0)
    .sort((a, b) => b.position - a.position);
  const expenseMonthIndex = expenseMonth ? monthNames.findIndex((month) => normalize(month) === expenseMonth) : -1;
  const monthIndex = expenseMonthIndex >= 0 ? expenseMonthIndex : mentionedMonths[0]?.index ?? -1;
  return monthIndex >= 0 ? { year, month: monthIndex + 1 } : null;
}

function categoryFor(label: string): string {
  const clean = normalize(label);
  if (/SALARIO|PAGAMENTO/.test(clean)) return 'Salários & Equipes';
  if (/ALOJ|ALUGUEL|AGUA|LUZ|LIMPEZA/.test(clean)) return 'Alojamento';
  if (/CARRO|COMBUST|VIA VERDE|MULTA|SEGURO|IMAS/.test(clean)) return 'Carros & Carrinhas';
  if (/IMPOST|NISS|IRS|TAXA|SEGURANCA SOCIAL/.test(clean)) return 'Impostos & NISS';
  if (/FERRAMENT|EPI|MAQUINA/.test(clean)) return 'Ferramentas & EPIs';
  if (/CARTAO|BANCO/.test(clean)) return 'Cartão & Bancos';
  return 'Outros Custos';
}

function parseVertical(sheetName: string, rows: unknown[][]): ImportPeriod | null {
  const title = rows.slice(0, 6).flat().map(normalize).join(' ');
  if (!title.includes('PLANILHA DE CUSTOS')) return null;
  const period = detectPeriod(title, Number(normalize(sheetName).match(/20\d{2}/)?.[0] || 2025));
  if (!period) return null;
  const revenues: ImportRevenue[] = [];
  const expenses: ImportLine[] = [];
  let inCosts = false;
  let currentCategory = 'Outros Custos';
  rows.forEach((row) => {
    const rawLabel = row[0];
    const label = normalize(rawLabel);
    const amount = asAmount(row[1]);
    const fundLabel = normalize(row[11]);
    const fundAmount = asAmount(row[12]);
    if (fundLabel && fundAmount > 0 && !isTotal(fundLabel)) {
      expenses.push({ name: String(row[11]).trim(), amount: fundAmount, category: categoryFor(fundLabel) });
    }
    if (!label) return;
    if (/^1\.0.*CUSTOS/.test(label)) { inCosts = true; return; }
    if (!inCosts && amount > 0 && !isTotal(label)) revenues.push({ client: String(rawLabel).trim(), amount });
    if (inCosts && /^1\.[1-9]/.test(label)) { currentCategory = categoryFor(label); return; }
    if (inCosts && amount > 0 && !isTotal(label)) expenses.push({ name: String(rawLabel).trim(), amount, category: currentCategory === 'Outros Custos' ? categoryFor(label) : currentCategory, notes: row[3] ? String(row[3]) : undefined });
  });
  return { key: `${period.year}-${period.month}`, name: `${monthNames[period.month - 1]} ${period.year}`, ...period, revenues, expenses, sourceSheet: sheetName };
}

function parseHorizontalExpenses(sheetName: string, rows: unknown[][]): ImportPeriod[] {
  const periods: ImportPeriod[] = [];
  const headerRow = rows.findIndex((row) => row.some((cell) => normalize(cell).includes('CONTAS A PAGAR')));
  if (headerRow < 0) return periods;
  const headers = rows[headerRow];
  for (let labelCol = 0; labelCol < headers.length - 1; labelCol++) {
    const header = normalize(headers[labelCol]);
    if (!header.includes('CONTAS A PAGAR')) continue;
    const detected = detectPeriod(header);
    if (!detected) continue;
    const expenses: ImportLine[] = [];
    let currentCategory = 'Outros Custos';
    for (let rowIndex = headerRow + 1; rowIndex < rows.length; rowIndex++) {
      const rawLabel = rows[rowIndex]?.[labelCol];
      const label = normalize(rawLabel);
      const amount = asAmount(rows[rowIndex]?.[labelCol + 1]);
      if (!label) continue;
      if (amount === 0 && !isTotal(label)) { currentCategory = categoryFor(label); continue; }
      if (amount > 0 && !isTotal(label)) expenses.push({ name: String(rawLabel).trim(), amount, category: currentCategory === 'Outros Custos' ? categoryFor(label) : currentCategory });
    }
    periods.push({ key: `${detected.year}-${detected.month}`, name: `${monthNames[detected.month - 1]} ${detected.year}`, ...detected, revenues: [], expenses, sourceSheet: sheetName });
  }
  return periods;
}

export function parseHistoricalWorkbook(buffer: ArrayBuffer): ImportPreview {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const periods = new Map<string, ImportPeriod>();
  const ignoredSheets: string[] = [];
  const warnings: string[] = [];
  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
    const heading = rows.slice(0, 3).flat().map(normalize).join(' ');
    if (heading.includes('LEVANTAMENTO PARA REPARTICAO') || heading.includes('FATURAMENTO BRUTO')) {
      ignoredSheets.push(sheetName);
      return;
    }
    const parsed = [parseVertical(sheetName, rows), ...parseHorizontalExpenses(sheetName, rows)].filter(Boolean) as ImportPeriod[];
    if (!parsed.length) { ignoredSheets.push(sheetName); return; }
    parsed.forEach((period) => {
      const existing = periods.get(period.key);
      if (existing) { existing.revenues.push(...period.revenues); existing.expenses.push(...period.expenses); }
      else periods.set(period.key, period);
    });
  });
  if (ignoredSheets.length) warnings.push(`${ignoredSheets.length} folha(s) consolidada(s) não foram importadas para evitar duplicação de totais.`);
  return { periods: [...periods.values()].sort((a, b) => (a.year - b.year) || (a.month - b.month)), ignoredSheets, warnings };
}

export async function importHistoricalPeriods(
  preview: ImportPreview,
  onProgress?: (progress: ImportProgress) => void
): Promise<{ imported: number; skipped: number }> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const total = preview.periods.length;
  onProgress?.({ completed: 0, total, label: 'A preparar a importação…' });
  const organizationId = await getOrganizationId();
  const { data: auth } = await supabase.auth.getUser();
  const { data: existingPeriods, error: existingError } = await supabase.from('financial_periods').select('year,month').eq('organization_id', organizationId);
  if (existingError) throw existingError;
  const existingKeys = new Set((existingPeriods || []).map((row) => `${row.year}-${row.month}`));
  let imported = 0;
  let skipped = 0;

  for (const [index, period] of preview.periods.entries()) {
    onProgress?.({ completed: index, total, label: `A processar ${period.name}…` });
    if (existingKeys.has(period.key)) {
      skipped++;
      onProgress?.({ completed: index + 1, total, label: `${period.name} já existia e foi ignorado.` });
      continue;
    }
    const { data: createdPeriod, error: periodError } = await supabase.from('financial_periods').insert({ organization_id: organizationId, name: period.name, period_type: 'mensal', year: period.year, month: period.month }).select('id').single();
    if (periodError) throw periodError;
    try {
      const categoryNames = [...new Set(period.expenses.map((line) => line.category))];
      for (const name of categoryNames) {
        const { error } = await supabase.from('categories').upsert({ organization_id: organizationId, name, type: 'expense' }, { onConflict: 'organization_id,type,name' });
        if (error) throw error;
      }
      const { data: categories, error: categoryError } = await supabase.from('categories').select('id,name').eq('organization_id', organizationId).eq('type', 'expense');
      if (categoryError) throw categoryError;
      const categoryIds = new Map((categories || []).map((row) => [row.name, row.id]));
      if (period.revenues.length) {
        const { error } = await supabase.from('revenues').insert(period.revenues.map((line) => ({ organization_id: organizationId, period_id: createdPeriod.id, client: line.client, amount: line.amount, status: 'pago', created_by: auth.user?.id })));
        if (error) throw error;
      }
      if (period.expenses.length) {
        const { error } = await supabase.from('expenses').insert(period.expenses.map((line) => ({ organization_id: organizationId, period_id: createdPeriod.id, name: line.name, amount: line.amount, category_id: categoryIds.get(line.category), note: line.notes, created_by: auth.user?.id })));
        if (error) throw error;
      }
      imported++;
      onProgress?.({ completed: index + 1, total, label: `${period.name} importado com sucesso.` });
    } catch (error) {
      await supabase.from('financial_periods').delete().eq('id', createdPeriod.id);
      throw error;
    }
  }
  onProgress?.({ completed: total, total, label: 'Importação concluída.' });
  return { imported, skipped };
}
