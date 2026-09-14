import { CostSheet, InvoicingCycle } from '../types.ts';

export interface CategorySummary {
  category: string;
  label: string;
  total: number;
  itemsCount: number;
  percentageOfCost: number;
}

export interface SheetCalculationResult {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  marginPercent: number;
  categoriesSummary: CategorySummary[];
  totalFundExpenses: number;
  partnerAllocations: { partnerId: string; name: string; percentage: number; amount: number }[];
  calculatedDifferenceInAccount: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  carros: '1.1 - Carros & Carrinhas',
  alojamento: '1.2 - Alojamento & Instalações',
  impostos: '1.3 - Taxas, Multas e Impostos',
  cartao: '1.4 - Cartão de Crédito',
  ferramentas: '1.5 - Ferramentas & Outros Gastos',
  salarios: '1.6 - Salários de Equipes',
  outros: '1.7 - Outros Custos'
};

export function calculateSheetMetrics(sheet: CostSheet): SheetCalculationResult {
  const totalRevenue = (sheet.revenues || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalCost = (sheet.costs || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Category breakdowns
  const categoriesMap: Record<string, { total: number; count: number }> = {};
  (sheet.costs || []).forEach((item) => {
    const cat = item.category || 'outros';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { total: 0, count: 0 };
    }
    categoriesMap[cat].total += Number(item.amount) || 0;
    categoriesMap[cat].count += 1;
  });

  const categoriesSummary: CategorySummary[] = Object.keys(CATEGORY_LABELS).map((catKey) => {
    const total = categoriesMap[catKey]?.total || 0;
    const count = categoriesMap[catKey]?.count || 0;
    return {
      category: catKey,
      label: CATEGORY_LABELS[catKey] || catKey,
      total,
      itemsCount: count,
      percentageOfCost: totalCost > 0 ? (total / totalCost) * 100 : 0
    };
  });

  const totalFundExpenses = (sheet.fundExpenses || []).reduce((sum, fe) => sum + (Number(fe.amount) || 0), 0);

  // Partner profit distribution (e.g. 25% each or customized)
  const distributableProfit = Math.max(0, netProfit);
  const partnerAllocations = (sheet.partners || []).map((p) => ({
    partnerId: p.id,
    name: p.name,
    percentage: p.percentage,
    amount: Number(((distributableProfit * p.percentage) / 100).toFixed(2))
  }));

  // Bank reconciliation
  const rec = sheet.reconciliation;
  let calculatedDifferenceInAccount = 0;
  if (rec) {
    // Formula from sheets: Saldo em conta - (Vales + Alojamento + Combustível + Outros)
    const totalDeductions = (Number(rec.advances) || 0) + (Number(rec.housingCosts) || 0) + (Number(rec.fuelCosts) || 0) + (Number(rec.otherDiffs) || 0);
    calculatedDifferenceInAccount = (Number(rec.accountBalance) || 0) - totalDeductions;
  }

  return {
    totalRevenue,
    totalCost,
    netProfit,
    marginPercent,
    categoriesSummary,
    totalFundExpenses,
    partnerAllocations,
    calculatedDifferenceInAccount
  };
}

export interface InvoicingSummary {
  totalInvoiced: number;
  byCompany: Record<string, number>;
  byProject: Record<string, number>;
  byMonth: Record<string, number>;
  byCycle: Record<string, number>;
}

export function calculateInvoicingSummary(matrix: InvoicingCycle[]): InvoicingSummary {
  const byCompany: Record<string, number> = {};
  const byProject: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byCycle: Record<string, number> = {};
  let totalInvoiced = 0;

  matrix.forEach((item) => {
    const amt = Number(item.amount) || 0;
    totalInvoiced += amt;

    byCompany[item.company] = (byCompany[item.company] || 0) + amt;
    byProject[item.project] = (byProject[item.project] || 0) + amt;
    byMonth[item.month] = (byMonth[item.month] || 0) + amt;
    byCycle[item.cycleName] = (byCycle[item.cycleName] || 0) + amt;
  });

  return {
    totalInvoiced,
    byCompany,
    byProject,
    byMonth,
    byCycle
  };
}
