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
    list.push({ id: row.id, date: row.expense_date, category: categoryNames.get(row.category_id) || row.subcategory || 'outros', subCategory: row.subcategory, name: row.name, amount: Number(row.amount), paymentMethod: row.payment_method, note: row.note, paidFromFund: row.paid_from_fund });
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

async function getCurrentUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error || new Error('Sessão inválida.');
  return data.user.id;
}

async function resolveCategoryId(organizationId: string, name: string | undefined, type: 'entry' | 'expense'): Promise<string | null> {
  if (!supabase || !name?.trim()) return null;
  const normalized = name.trim();
  const { data: existing, error: selectError } = await supabase
    .from('categories')
    .select('id,name')
    .eq('organization_id', organizationId)
    .eq('type', type);
  if (selectError) throw selectError;
  const match = existing?.find((row) => row.name.localeCompare(normalized, undefined, { sensitivity: 'accent' }) === 0);
  if (match) return match.id;
  const { data: created, error } = await supabase
    .from('categories')
    .insert({ organization_id: organizationId, name: normalized, type })
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}

export async function createCategory(category: Partial<CategoryDefinition>): Promise<CategoryDefinition> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const { data, error } = await supabase.from('categories').insert({
    organization_id: organizationId,
    name: category.name?.trim(),
    type: category.type,
    color: category.color || null,
    icon: category.icon || null,
    description: category.description || null
  }).select('id,name,type,color,icon,description').single();
  if (error) throw error;
  return data as CategoryDefinition;
}

export async function removeCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('organization_id', organizationId);
  if (error) throw error;
}

export async function createRevenue(periodId: string, item: Partial<RevenueItem>): Promise<RevenueItem> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const categoryId = await resolveCategoryId(organizationId, item.category, 'entry');
  const { data, error } = await supabase.from('revenues').insert({
    organization_id: organizationId, period_id: periodId, entry_date: item.date || null,
    client: item.client?.trim(), project: item.project || null, category_id: categoryId,
    description: item.description || null, amount: item.amount, status: item.status || 'previsto',
    payment_method: item.paymentMethod || null, notes: item.notes || null, created_by: await getCurrentUserId()
  }).select('*').single();
  if (error) throw error;
  return { id: data.id, date: data.entry_date, client: data.client, project: data.project, category: item.category, description: data.description, amount: Number(data.amount), status: data.status, paymentMethod: data.payment_method, notes: data.notes };
}

export async function updateRevenue(id: string, item: Partial<RevenueItem>): Promise<RevenueItem> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const categoryId = item.category === undefined ? undefined : await resolveCategoryId(organizationId, item.category, 'entry');
  const changes: Record<string, unknown> = {};
  if (item.date !== undefined) changes.entry_date = item.date || null;
  if (item.client !== undefined) changes.client = item.client.trim();
  if (item.project !== undefined) changes.project = item.project || null;
  if (item.category !== undefined) changes.category_id = categoryId;
  if (item.description !== undefined) changes.description = item.description || null;
  if (item.amount !== undefined) changes.amount = item.amount;
  if (item.status !== undefined) changes.status = item.status;
  if (item.paymentMethod !== undefined) changes.payment_method = item.paymentMethod || null;
  if (item.notes !== undefined) changes.notes = item.notes || null;
  const { data, error } = await supabase.from('revenues').update(changes).eq('id', id).eq('organization_id', organizationId).select('*').single();
  if (error) throw error;
  return { id: data.id, date: data.entry_date, client: data.client, project: data.project, category: item.category, description: data.description, amount: Number(data.amount), status: data.status, paymentMethod: data.payment_method, notes: data.notes };
}

export async function removeRevenue(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const { error } = await supabase.from('revenues').delete().eq('id', id).eq('organization_id', organizationId);
  if (error) throw error;
}

export async function createExpense(periodId: string, item: Partial<CostItem>): Promise<CostItem> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const categoryId = await resolveCategoryId(organizationId, item.category, 'expense');
  const { data, error } = await supabase.from('expenses').insert({
    organization_id: organizationId, period_id: periodId, expense_date: item.date || null,
    category_id: categoryId, subcategory: item.category || item.subCategory || null,
    name: item.name?.trim(), amount: item.amount, payment_method: item.paymentMethod || null,
    note: item.note || null, paid_from_fund: item.paidFromFund || false, created_by: await getCurrentUserId()
  }).select('*').single();
  if (error) throw error;
  return { id: data.id, date: data.expense_date, category: item.category || data.subcategory || 'outros', subCategory: data.subcategory, name: data.name, amount: Number(data.amount), paymentMethod: data.payment_method, note: data.note, paidFromFund: data.paid_from_fund };
}

export async function updateExpense(id: string, item: Partial<CostItem>): Promise<CostItem> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const categoryId = item.category === undefined ? undefined : await resolveCategoryId(organizationId, item.category, 'expense');
  const changes: Record<string, unknown> = {};
  if (item.date !== undefined) changes.expense_date = item.date || null;
  if (item.category !== undefined) { changes.category_id = categoryId; changes.subcategory = item.category; }
  if (item.name !== undefined) changes.name = item.name.trim();
  if (item.amount !== undefined) changes.amount = item.amount;
  if (item.paymentMethod !== undefined) changes.payment_method = item.paymentMethod || null;
  if (item.note !== undefined) changes.note = item.note || null;
  if (item.paidFromFund !== undefined) changes.paid_from_fund = item.paidFromFund;
  const { data, error } = await supabase.from('expenses').update(changes).eq('id', id).eq('organization_id', organizationId).select('*').single();
  if (error) throw error;
  return { id: data.id, date: data.expense_date, category: item.category || data.subcategory || 'outros', subCategory: data.subcategory, name: data.name, amount: Number(data.amount), paymentMethod: data.payment_method, note: data.note, paidFromFund: data.paid_from_fund };
}

export async function removeExpense(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('organization_id', organizationId);
  if (error) throw error;
}

export async function saveSystemSettings(settings: Partial<AppDatabase['settings']>): Promise<Partial<AppDatabase['settings']>> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const organizationId = await getOrganizationId();

  const organizationChanges: Record<string, unknown> = {};
  if (settings.companyName !== undefined) organizationChanges.name = settings.companyName.trim();
  if (settings.currency !== undefined) organizationChanges.currency = settings.currency;
  if (Object.keys(organizationChanges).length) {
    const { error } = await supabase.from('organizations').update(organizationChanges).eq('id', organizationId);
    if (error) throw error;
  }

  const financialSettings: Record<string, unknown> = { organization_id: organizationId };
  if (settings.accountCurrentBalance !== undefined) financialSettings.account_current_balance = settings.accountCurrentBalance;
  if (settings.defaultIrcRate !== undefined) financialSettings.default_irc_rate = settings.defaultIrcRate;
  if (settings.defaultFundReservePercentage !== undefined) financialSettings.default_fund_reserve_percentage = settings.defaultFundReservePercentage;
  if (Object.keys(financialSettings).length > 1) {
    const { error } = await supabase.from('company_settings').upsert(financialSettings, { onConflict: 'organization_id' });
    if (error) throw error;
  }

  let savedPartners = settings.partners;
  if (settings.partners) {
    const { data: existing, error: existingError } = await supabase.from('partners').select('id').eq('organization_id', organizationId);
    if (existingError) throw existingError;
    const existingIds = new Set((existing || []).map((partner) => partner.id));
    savedPartners = [];
    for (const partner of settings.partners) {
      const payload = { organization_id: organizationId, name: partner.name.trim(), percentage: partner.percentage, active: true };
      if (existingIds.has(partner.id)) {
        const { data, error } = await supabase.from('partners').update(payload).eq('id', partner.id).eq('organization_id', organizationId).select('id,name,percentage').single();
        if (error) throw error;
        savedPartners.push({ id: data.id, name: data.name, percentage: Number(data.percentage) });
      } else {
        const { data, error } = await supabase.from('partners').insert(payload).select('id,name,percentage').single();
        if (error) throw error;
        savedPartners.push({ id: data.id, name: data.name, percentage: Number(data.percentage) });
      }
    }
  }

  return { ...settings, partners: savedPartners };
}

export async function setFinancialResetPin(pin: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.rpc('set_financial_reset_pin', { new_pin: pin });
  if (error) throw error;
}

export async function resetFinancialData(pin: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.rpc('reset_financial_data', { reset_pin: pin });
  if (error) throw error;
}
