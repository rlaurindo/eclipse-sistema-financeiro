export type UserRole = 'admin' | 'user' | 'viewer';

export type ActiveTab = 
  | 'dashboard'     // Painel Geral (Faturamento, Conta Corrente, Balanço, Despesas)
  | 'entries'       // Entradas (Formulário + Tabela de Lançamentos)
  | 'expenses'      // Despesas (Formulário + Tabela de Gastos)
  | 'control_panel'; // Painel de Controle (Categorias, Usuários, Parâmetros, Sócios)

export interface ViewPreferences {
  privacyMode: boolean; // Mascarar valores com •••
  displayDensity: 'comfortable' | 'compact';
  summaryDetailLevel: 'executive' | 'detailed';
  showMarginAlerts: boolean;
  activePartnerFilter: string; // 'all' or specific partner id
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface UserSession {
  id?: string;
  role: UserRole;
  name: string;
  email: string;
  firstAccessPending?: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  type: 'expense' | 'entry';
  color?: string;
  icon?: string;
  description?: string;
}

export interface RevenueItem {
  id: string;
  date?: string; // YYYY-MM-DD
  client: string; // e.g. "CIP", "EMPRESA ESPANO", "EMPRESA CNT", "NOVAGENTE"
  project?: string; // e.g. "QUADRA - VILA NOVA DE GAIA", "CUBIC II"
  category?: string; // e.g. "Empreitada", "Medição Mensal", "Adiantamento", "Serviços"
  description?: string;
  amount: number;
  status?: 'pago' | 'pendente' | 'previsto';
  paymentMethod?: string; // "Transferência", "Cheque", "Numerário"
  notes?: string;
}

export interface CostItem {
  id: string;
  date?: string; // YYYY-MM-DD
  category: 'carros' | 'alojamento' | 'impostos' | 'cartao' | 'ferramentas' | 'salarios' | 'outros' | string;
  subCategory?: string;
  name: string; // e.g. "COMBUSTIVEL", "VIA VERDE", "ALUGUEL DE ALOJAMENTO", "CARPINTEIROS", "NISS E TAXAS"
  amount: number;
  paymentMethod?: string; // "Conta Corrente", "Cartão Empresa", "Fundo Caixa", "Transferência"
  note?: string; // e.g. "GASTO DA FESTA TIRAR DO FUNDO"
  paidFromFund?: boolean;
}

export interface FundExpenseItem {
  id: string;
  name: string;
  amount: number;
  date?: string;
  category?: string;
  notes?: string;
}

export interface BankReconciliation {
  accountBalance: number; // Saldo em Conta
  advances: number; // Vales feitos
  housingCosts: number; // Custos do alojamento
  fuelCosts: number; // Combustível
  otherDiffs: number;
  calculatedDifference: number; // Diferença em conta
  notes?: string;
}

export interface PartnerDistribution {
  id: string;
  name: string;
  percentage: number; // e.g. 25% each for 4 partners
  amount: number;
}

export interface InvoicingCycle {
  id: string;
  cycleName: string;
  month: string;
  company: string;
  project: string;
  amount: number;
}

export interface CostSheet {
  id: string;
  name: string; // "AGOSTO 2026", "SETEMBRO 2024", etc.
  periodType: 'mensal' | 'semestral' | 'trimestral' | 'anual';
  year: number;
  month?: number;
  createdAt: string;
  updatedAt: string;

  // Revenues / Entradas
  revenues: RevenueItem[];
  companyAccountFundBalance: number; // SALDO EM CONTA EMPRESA / CONTA CORRENTE

  // Costs / Despesas
  costs: CostItem[];

  // Cash Fund & Notes
  fundExpenses: FundExpenseItem[];
  fundValueReserve: number; // VALOR PARA O FUNDO DE CAIXA
  consignationReserveNote?: string;

  // Bank Reconciliation Data
  reconciliation?: BankReconciliation;

  // Tax and IRC summary
  ircEstimatedTax?: number;
  compensationDifference?: number;

  // Partners Split Configuration
  partners: PartnerDistribution[];
}

export interface SystemSettings {
  companyName: string;
  currency: string;
  accountCurrentBalance?: number; // Saldo Global em Conta Corrente
  partners: { id: string; name: string; percentage: number }[];
  defaultIrcRate: number; // %
  defaultFundReservePercentage: number; // %
  defaultCategories: { key: string; label: string; defaultItems: string[] }[];
  customCategories?: CategoryDefinition[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  action: string;
  sheetId?: string;
  details: string;
}

export interface AppDatabase {
  users: UserAccount[];
  sheets: CostSheet[];
  invoicingMatrix: InvoicingCycle[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
}
