import * as XLSX from 'xlsx';
import { CostSheet, InvoicingCycle } from '../types.ts';

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0,00 €';
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0,0%';
  return `${value.toFixed(1)}%`;
}

export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '-';
  try {
    return new Date(isoDate).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoDate;
  }
}

// Export single sheet to Excel workbook
export function exportSheetToExcel(sheet: CostSheet): void {
  const wb = XLSX.utils.book_new();

  // 1. Resumo & Faturamento
  const totalRev = sheet.revenues.reduce((s, r) => s + (r.amount || 0), 0);
  const totalCost = sheet.costs.reduce((s, c) => s + (c.amount || 0), 0);
  const netProfit = totalRev - totalCost;

  const summaryData = [
    ['SISTEMA DE GESTÃO FINANCEIRA E CUSTOS DE OBRAS'],
    ['PLANILHA:', sheet.name, 'ANO:', sheet.year],
    [''],
    ['FATURAMENTO TOTAL', 'VALOR (€)', 'STATUS'],
    ...sheet.revenues.map((r) => [r.client, r.amount, r.status || 'pago']),
    ['TOTAL DE FATURAMENTO', totalRev],
    ['SALDO EM CONTA EMPRESA FUNDO', sheet.companyAccountFundBalance],
    [''],
    ['2.0 - RESUMO FINANCEIRO', 'VALOR (€)'],
    ['CUSTO TOTAL OPERACIONAL', totalCost],
    ['FATURAMENTO TOTAL', totalRev],
    ['LUCRO LÍQUIDO', netProfit],
    [''],
    ['DIVISÃO DE SÓCIOS', '%', 'VALOR (€)'],
    ...sheet.partners.map((p) => [p.name, `${p.percentage}%`, (netProfit > 0 ? (netProfit * p.percentage) / 100 : 0)])
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo & Faturamento');

  // 2. Custos Detalhados
  const costsData = [
    ['CATEGORIA', 'ITEM / DESCRIÇÃO', 'VALOR (€)', 'OBSERVAÇÕES'],
    ...sheet.costs.map((c) => [c.category.toUpperCase(), c.name, c.amount, c.note || '']),
    [''],
    ['TOTAL GERAL DE CUSTOS', '', totalCost, '']
  ];
  const wsCosts = XLSX.utils.aoa_to_sheet(costsData);
  XLSX.utils.book_append_sheet(wb, wsCosts, 'Custos Operacionais');

  // 3. Gastos do Fundo & Conciliação
  const fundData = [
    ['GASTOS DO FUNDO', 'VALOR (€)', 'OBSERVAÇÕES'],
    ...sheet.fundExpenses.map((fe) => [fe.name, fe.amount, fe.notes || '']),
    ['TOTAL GASTOS DO FUNDO', sheet.fundExpenses.reduce((s, fe) => s + fe.amount, 0), ''],
    [''],
    ['CONCILIAÇÃO BANCÁRIA', 'VALOR (€)'],
    ['VALOR NA CONTA', sheet.reconciliation?.accountBalance || 0],
    ['VALES FEITOS', sheet.reconciliation?.advances || 0],
    ['CUSTOS DE ALOJAMENTO', sheet.reconciliation?.housingCosts || 0],
    ['COMBUSTÍVEL', sheet.reconciliation?.fuelCosts || 0],
    ['DIFERENÇA EM CONTA', sheet.reconciliation?.calculatedDifference || 0],
    ['NOTAS', sheet.reconciliation?.notes || '']
  ];
  const wsFund = XLSX.utils.aoa_to_sheet(fundData);
  XLSX.utils.book_append_sheet(wb, wsFund, 'Fundo & Conciliação');

  // Generate and download
  XLSX.writeFile(wb, `${sheet.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Financeiro.xlsx`);
}

// Export Invoicing Matrix to Excel
export function exportInvoicingToExcel(matrix: InvoicingCycle[]): void {
  const wb = XLSX.utils.book_new();
  const data = [
    ['FATURAMENTO POR OBRAS E EMPRESAS'],
    [''],
    ['EMPRESA', 'OBRA / PROJETO', 'CICLO DE FATURAÇÃO', 'MÊS', 'VALOR (€)'],
    ...matrix.map((item) => [item.company, item.project, item.cycleName, item.month, item.amount]),
    [''],
    ['TOTAL GERAL FATURADO', '', '', '', matrix.reduce((s, i) => s + i.amount, 0)]
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Faturamento Obras');
  XLSX.writeFile(wb, `Faturamento_Obras_Matriz.xlsx`);
}
