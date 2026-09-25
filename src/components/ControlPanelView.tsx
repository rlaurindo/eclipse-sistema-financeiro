import React, { useState } from 'react';
import { 
  Sliders, 
  Tag, 
  Users, 
  Wallet, 
  Database, 
  Plus, 
  Trash2, 
  Shield, 
  UserCheck, 
  Eye, 
  Check, 
  RefreshCw, 
  Download, 
  Building2, 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { FileSpreadsheet } from 'lucide-react';
import { SystemSettings, UserAccount, CategoryDefinition, CostSheet } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useAppDialog } from '../context/AppDialogContext.tsx';

const CATEGORY_PALETTE = ['#8b5cf6', '#f59e0b', '#06b6d4', '#f43f5e', '#10b981', '#f97316', '#6366f1', '#14b8a6'];

const getCategoryColor = (name: string, type: 'expense' | 'entry') => {
  const normalizedName = name.toLocaleLowerCase('pt-PT');
  const semanticColors: Array<[string[], string]> = [
    [['alojamento', 'estadia', 'hotel'], '#8b5cf6'],
    [['imposto', 'niss', 'irs', 'irc'], '#ef4444'],
    [['carro', 'carrinha', 'veículo', 'combustível'], '#3b82f6'],
    [['ferramenta', 'epi', 'material'], '#10b981'],
    [['salário', 'equipa', 'funcionário'], '#06b6d4'],
    [['cartão', 'banco', 'financeiro'], '#f59e0b'],
    [['outro', 'diverso'], '#64748b']
  ];

  const semanticMatch = semanticColors.find(([keywords]) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  );
  if (semanticMatch) return semanticMatch[1];

  // Entradas sem uma correspondência conhecida começam pela família verde/teal.
  const palette = type === 'entry'
    ? ['#10b981', '#14b8a6', '#06b6d4', '#84cc16', ...CATEGORY_PALETTE]
    : CATEGORY_PALETTE;
  const hash = Array.from(normalizedName).reduce(
    (value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0,
    0
  );
  return palette[hash % palette.length];
};

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

interface ControlPanelViewProps {
  settings: SystemSettings;
  users: UserAccount[];
  categories: CategoryDefinition[];
  sheets: CostSheet[];
  activeSheet: CostSheet;
  onUpdateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  onAddCategory: (category: Partial<CategoryDefinition>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateUser: (user: Partial<UserAccount>) => Promise<void>;
  onUpdateUserRole: (id: string, role: 'admin' | 'user') => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onSetResetPin: (pin: string) => Promise<void>;
  onResetDatabase: (pin: string) => Promise<void>;
  onOpenHistoricalImport: () => void;
}

export const ControlPanelView: React.FC<ControlPanelViewProps> = ({
  settings,
  users,
  categories,
  sheets,
  activeSheet,
  onUpdateSettings,
  onAddCategory,
  onDeleteCategory,
  onCreateUser,
  onUpdateUserRole,
  onDeleteUser,
  onSetResetPin,
  onResetDatabase,
  onOpenHistoricalImport
}) => {
  const { user: currentUser, isAdmin, formatCurrency } = useAuth();
  const { confirmAction, showAlert } = useAppDialog();
  const [activeSection, setActiveSection] = useState<'categories' | 'users' | 'finance' | 'backup'>('categories');

  // --- Category Form State ---
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'entry'>('expense');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [newResetPin, setNewResetPin] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [securitySubmitting, setSecuritySubmitting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // --- User Form State ---
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [userSubmitting, setUserSubmitting] = useState(false);

  // --- Financial Parameters State ---
  const [accountBalance, setAccountBalance] = useState<string>(
    (activeSheet?.companyAccountFundBalance || settings?.accountCurrentBalance || 0).toString()
  );
  const [ircRate, setIrcRate] = useState<string>((settings?.defaultIrcRate || 21).toString());
  const [partners, setPartners] = useState(
    settings?.partners || [
      { id: '1', name: 'SÓCIO 1', percentage: 25 },
      { id: '2', name: 'SÓCIO 2', percentage: 25 },
      { id: '3', name: 'SÓCIO 3', percentage: 25 },
      { id: '4', name: 'SÓCIO 4', percentage: 25 }
    ]
  );
  const [financeSaved, setFinanceSaved] = useState(false);

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setCatSubmitting(true);
      await onAddCategory({
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor
      });
      setNewCatName('');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;

    try {
      setUserSubmitting(true);
      await onCreateUser({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword.trim(),
        role: newUserRole
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      accountCurrentBalance: parseFloat(accountBalance) || 0,
      defaultIrcRate: parseFloat(ircRate) || 21,
      partners
    });
    setFinanceSaved(true);
    setTimeout(() => setFinanceSaved(false), 3000);
  };

  const handlePartnerPercentageChange = (id: string, value: number) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, percentage: value } : p)));
  };

  const handlePartnerNameChange = (id: string, name: string) => {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ sheets, settings, users }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            Painel de Controle & Gestão
          </span>
        </div>
        <h2 className="text-xl font-black text-slate-900">
          Painel de Controle
        </h2>
        <p className="text-xs text-slate-500">
          Adicione novas categorias, gerencie usuários, ajuste saldos bancários e parâmetros societários.
        </p>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveSection('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'categories'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Controle de Usuários ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('finance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'finance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Conta Corrente & Sócios</span>
          </button>

          <button
            onClick={() => setActiveSection('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeSection === 'backup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Dados</span>
          </button>
          {isAdmin && <button onClick={onOpenHistoricalImport} className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"><FileSpreadsheet className="h-4 w-4" />Importar histórico Excel</button>}
        </div>
      </div>

      {/* SECTION 1: CATEGORIAS */}
      {activeSection === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Category Form (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs h-fit">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Adicionar Nova Categoria
                </h3>
                <p className="text-[11px] text-slate-500">
                  Crie centros de custo ou tipos de faturamento personalizados
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nome da Categoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Subempreiteiros, Alimentação, Cartório..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatType('expense')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      newCatType === 'expense'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Despesa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType('entry')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      newCatType === 'entry'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Entrada</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Cor da Identificação
                </label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-6 h-6 rounded-full transition cursor-pointer border-2 ${
                        newCatColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={catSubmitting || !newCatName.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{catSubmitting ? 'Salvando...' : 'Adicionar Categoria'}</span>
              </button>
            </form>
          </div>

          {/* Categories List (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Categorias Cadastradas ({categories.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Categorias disponíveis para classificação de Entradas e Despesas
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const categoryColor = getCategoryColor(cat.name, cat.type);
                return (
                <div
                  key={cat.id}
                  className="p-3.5 border rounded-xl flex items-center justify-between gap-2 transition-colors"
                  style={{
                    backgroundColor: hexToRgba(categoryColor, 0.055),
                    borderColor: hexToRgba(categoryColor, 0.2)
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{cat.name}</div>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                        cat.type === 'entry' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cat.type === 'entry' ? 'Entrada' : 'Despesa'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CONTROLE DE USUÁRIOS */}
      {activeSection === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add User Form (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs h-fit">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cadastrar Novo Usuário
                </h3>
                <p className="text-[11px] text-slate-500">
                  Adicione colaboradores com perfil de Administrador ou Leitor
                </p>
              </div>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Senha Inicial</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Perfil / Função</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Usuário Comum (Visualização / Consulta)</option>
                  <option value="admin">Administrador (Permissão Total para Edição)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={userSubmitting || !newUserName || !newUserEmail || !newUserPassword}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>{userSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}</span>
              </button>
            </form>
          </div>

          {/* Users Table (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Usuários Registrados ({users.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Controle de permissões e acessos ao sistema financeiro
            </p>

            <div className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = currentUser?.email === u.email;
                return (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="truncate">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && !isCurrent ? (
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateUserRole(u.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="user">LEITOR</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      )}

                      {isAdmin && !isCurrent && (
                        <button
                          onClick={async () => {
                            if (await confirmAction({
                              title: 'Remover utilizador',
                              message: `Deseja remover o utilizador "${u.name}"?`,
                              confirmLabel: 'Remover utilizador'
                            })) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remover Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CONTA CORRENTE & SÓCIOS */}
      {activeSection === 'finance' && (
        <form onSubmit={handleSaveFinance} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saldo da Conta Corrente */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Conta Corrente & Tesouraria
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defina o valor disponível no banco / conta da empresa
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Saldo Disponível em Conta Corrente (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Estimativa de Provisão de IRC (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={ircRate}
                  onChange={(e) => setIrcRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono focus:bg-white"
                />
              </div>
            </div>

            {/* Sócios & Percentuais */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Quotas dos Sócios
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configuração dos 4 sócios titulares para distribuição de lucros
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {partners.map((partner, idx) => (
                  <div key={partner.id} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={partner.name}
                      onChange={(e) => handlePartnerNameChange(partner.id, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                    <div className="flex items-center gap-1 w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={partner.percentage}
                        onChange={(e) => handlePartnerPercentageChange(partner.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-right font-mono"
                      />
                      <span className="text-xs text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {financeSaved && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Configurações salvas com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Salvar Parâmetros Financeiros
            </button>
          </div>
        </form>
      )}

      {/* SECTION 4: BACKUP E RESTAURAÇÃO */}
      {activeSection === 'backup' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Exportação e Manutenção de Dados
            </h3>
            <p className="text-xs text-slate-500">
              Faça cópias de segurança dos lançamentos financeiros ou restaure os dados caso necessário.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-slate-900 text-xs">Exportar Dados Completos (JSON)</div>
              <p className="text-[11px] text-slate-500">
                Baixe um arquivo seguro contendo todos os faturamentos, despesas e configurações.
              </p>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Backup</span>
              </button>
            </div>

            {isAdmin && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <div className="font-bold text-rose-900 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Zerar Dados Financeiros
                </div>
                <p className="text-[11px] text-rose-700">
                  Apaga períodos, entradas, despesas, categorias e parâmetros. Utilizadores e permissões são preservados.
                </p>
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-rose-900">Definir ou alterar PIN de segurança</label>
                  <div className="flex gap-2">
                    <input type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={newResetPin} onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, ''))} placeholder="4 a 8 algarismos" className="min-w-0 flex-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs" />
                    <button type="button" disabled={securitySubmitting || newResetPin.length < 4} onClick={async () => { try { setSecuritySubmitting(true); await onSetResetPin(newResetPin); setNewResetPin(''); showAlert('PIN de segurança definido com sucesso.'); } catch { /* o handler apresenta o erro */ } finally { setSecuritySubmitting(false); } }} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Guardar PIN</button>
                  </div>
                </div>
                <input type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={resetPin} onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))} placeholder="Confirme o PIN para zerar" className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs" />
                <button
                  type="button"
                  disabled={securitySubmitting || resetPin.length < 4}
                  onClick={() => setShowResetConfirmation(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{securitySubmitting ? 'A processar…' : 'Zerar Base Financeira'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showResetConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirmation-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !securitySubmitting) {
              setShowResetConfirmation(false);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="reset-confirmation-title" className="text-base font-black text-slate-900">
                  Confirmar limpeza da base financeira
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Esta operação é definitiva e não poderá ser anulada.
                </p>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">
                Serão apagados todos os períodos, entradas, despesas, categorias e parâmetros financeiros.
              </p>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                Os utilizadores e as respetivas permissões serão preservados.
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={securitySubmitting}
                onClick={() => setShowResetConfirmation(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={securitySubmitting}
                onClick={async () => {
                  try {
                    setSecuritySubmitting(true);
                    await onResetDatabase(resetPin);
                    setResetPin('');
                    setShowResetConfirmation(false);
                  } catch {
                    // O handler apresenta o erro e a janela permanece aberta para nova tentativa.
                  } finally {
                    setSecuritySubmitting(false);
                  }
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${securitySubmitting ? 'animate-spin' : ''}`} />
                {securitySubmitting ? 'A zerar dados…' : 'Sim, zerar dados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
