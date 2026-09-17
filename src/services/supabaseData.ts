import { supabase } from '../lib/supabase.ts';
import { AppDatabase, CategoryDefinition, CostItem, CostSheet, RevenueItem } from '../types.ts';

export async function getOrganizationId(): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão inválida.');
  const { data, error } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', auth.user.id);
  if (error) throw error;
  const membership = data?.find((item) => item.role === 'admin') || data?.[0];
  if (!membership?.organization_id) throw new Error('O utilizador ainda não está associado a uma organização.');
  return membership.organization_id;
}

export async function fetchDatabaseFromSupabase(): Promise<AppDatabase> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const [orgResult, settingsResult, periodsResult, categoriesResult, revenuesResult, expensesResult, partnersResult] = await Promise.all([
    supabase.from('organizations').select('name,currency').eq('id', organizationId).single(),
    supabase.from('company_settings').select('*').eq('organization_id', organizationId).maybeSingle(),
    supabase.from('financial_periods').select('*').eq('organization_id', organizationId).order('year').order('month'),
    supabase.from('categories').select('*').eq('organization_id', organizationId),
    supabase.from('revenues').select('*').eq('organization_id', organizationId),
    supabase.from('expenses').select('*').eq('organization_id', organizationId),
    supabase.from('partners').select('*').eq('organization_id', organizationId).eq('active', true)
  ]);
  const firstError = [orgResult, settingsResult, periodsResult, categoriesResult, revenuesResult, expensesResult, partnersResult].find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const categories: CategoryDefinition[] = (categoriesResult.data || []).map((row) => ({ id: row.id, name: row.name, type: row.type, color: row.color, icon: row.icon, description: row.description }));
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const revenuesByPeriod = new Map<string, RevenueItem[]>();
  for (const row of revenuesResult.data || []) {
    const list = revenuesByPeriod.get(row.period_id) || [];
    list.push({ id: row.id, date: row.entry_date, client: row.client, project: row.project, category: categoryNames.get(row.category_id), description: row.description, amount: Number(row.amount), status: row.status, paymentMethod: row.payment_method, notes: row.notes });
    revenuesByPeriod.set(row.period_id, list);
  }
  const expensesByPeriod = new Map<string, CostItem[]>();
  for (const row of expensesResult.data || []) {
    const list = expensesByPeriod.get(row.period_id) || [];
    list.push({ id: row.id, date: row.expense_date, category: categoryNames.get(row.category_id) || 'outros', subCategory: row.subcategory, name: row.name, amount: Number(row.amount), paymentMethod: row.payment_method, note: row.note, paidFromFund: row.paid_from_fund });
    expensesByPeriod.set(row.period_id, list);
  }
  const partners = (partnersResult.data || []).map((row) => ({ id: row.id, name: row.name, percentage: Number(row.percentage) }));
  const sheets: CostSheet[] = (periodsResult.data || []).map((row) => ({
    id: row.id, name: row.name, periodType: row.period_type, year: row.year, month: row.month,
    createdAt: row.created_at, updatedAt: row.updated_at,
    revenues: revenuesByPeriod.get(row.id) || [], costs: expensesByPeriod.get(row.id) || [], fundExpenses: [],
    companyAccountFundBalance: Number(row.company_account_fund_balance), fundValueReserve: Number(row.fund_value_reserve),
    consignationReserveNote: row.consignation_reserve_note, ircEstimatedTax: row.irc_estimated_tax == null ? undefined : Number(row.irc_estimated_tax),
    compensationDifference: row.compensation_difference == null ? undefined : Number(row.compensation_difference),
    partners: partners.map((partner) => ({ ...partner, amount: 0 }))
  }));
  return {
    users: [], sheets, invoicingMatrix: [], auditLogs: [],
    settings: {
      companyName: orgResult.data?.name || 'Gestão Financeira', currency: orgResult.data?.currency || 'EUR', partners,
      accountCurrentBalance: Number(settingsResult.data?.account_current_balance || 0),
      defaultIrcRate: Number(settingsResult.data?.default_irc_rate || 21),
      defaultFundReservePercentage: Number(settingsResult.data?.default_fund_reserve_percentage || 20),
      defaultCategories: [], customCategories: categories
    }
  };
}
