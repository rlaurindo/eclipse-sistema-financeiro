import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { EntriesView } from './components/EntriesView.tsx';
import { ExpensesView } from './components/ExpensesView.tsx';
import { ControlPanelView } from './components/ControlPanelView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { NewSheetModal } from './components/NewSheetModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { LoginGate } from './components/LoginGate.tsx';
import { 
  AppDatabase, 
  CostSheet, 
  RevenueItem, 
  CostItem, 
  CategoryDefinition, 
  UserAccount, 
  SystemSettings, 
  ActiveTab 
} from './types.ts';
import { RefreshCw } from 'lucide-react';

const emptyDatabase: AppDatabase = {
  users: [],
  sheets: [],
  invoicingMatrix: [],
  auditLogs: [],
  settings: {
    companyName: 'Gestão Financeira',
    currency: 'EUR',
    partners: [],
    defaultIrcRate: 21,
    defaultFundReservePercentage: 20,
    defaultCategories: [],
    customCategories: []
  }
};

function AppContent() {
  const { user, isAdmin, isAuthenticated, authLoading, authModalOpen, setAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeSheetId, setActiveSheetId] = useState<string>('');
  
  // Database state
  const [database, setDatabase] = useState<AppDatabase>(emptyDatabase);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  // Modals
  const [newSheetModalOpen, setNewSheetModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`API indisponível (${res.status})`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('A base de dados ainda não está conectada a esta publicação.');
      }
        const data: AppDatabase = await res.json();
        const safeData: AppDatabase = {
          ...emptyDatabase,
          ...data,
          users: data.users || [],
          sheets: data.sheets || [],
          invoicingMatrix: data.invoicingMatrix || [],
          auditLogs: data.auditLogs || [],
          settings: { ...emptyDatabase.settings, ...(data.settings || {}) }
        };
        setDatabase(safeData);
        
        // Pick August 2026 as active by default if available
        const agoSheet = data.sheets.find((s) => s.id === 'sheet-ago-2026' || (s.year === 2026 && s.month === 8));
        if (agoSheet) {
          setActiveSheetId(agoSheet.id);
        } else if (data.sheets.length > 0 && !data.sheets.some((s) => s.id === activeSheetId)) {
          setActiveSheetId(data.sheets[0].id);
        }
    } catch (err) {
      console.warn('Base de dados indisponível', err);
      setDatabase(emptyDatabase);
      setActiveSheetId('');
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar a base de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
    else setLoading(false);
  }, [isAuthenticated]);

  if (authLoading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">A verificar sessão…</div>;
  }

  if (!isAuthenticated) return <LoginGate />;

  const activeSheet = database.sheets.find((s) => s.id === activeSheetId) || database.sheets[0];

  const categories = database.settings.customCategories || [
    { id: 'cat-1', name: 'Carros & Carrinhas', type: 'expense', color: '#3b82f6' },
    { id: 'cat-2', name: 'Alojamento', type: 'expense', color: '#8b5cf6' },
    { id: 'cat-3', name: 'Impostos & NISS', type: 'expense', color: '#ef4444' },
    { id: 'cat-4', name: 'Cartão & Bancos', type: 'expense', color: '#f59e0b' },
    { id: 'cat-5', name: 'Ferramentas & EPIs', type: 'expense', color: '#10b981' },
    { id: 'cat-6', name: 'Salários & Equipes', type: 'expense', color: '#06b6d4' },
    { id: 'cat-7', name: 'Empreitada', type: 'entry', color: '#10b981' },
    { id: 'cat-8', name: 'Medição Mensal', type: 'entry', color: '#3b82f6' },
    { id: 'cat-9', name: 'Adiantamento', type: 'entry', color: '#f59e0b' },
    { id: 'cat-10', name: 'Serviços Extras', type: 'entry', color: '#8b5cf6' }
  ];

  // --- REVENUES (ENTRADAS) HANDLERS ---
  const handleAddRevenue = async (item: Partial<RevenueItem>) => {
    if (!isAdmin || !activeSheet) return;
    try {
      const res = await fetch(`/api/sheets/${activeSheet.id}/revenues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Falha ao registrar entrada');
      const created: RevenueItem = await res.json();

      setDatabase((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id === activeSheet.id) {
            return {
              ...s,
              revenues: [created, ...(s.revenues || [])]
            };
          }
          return s;
        })
      }));
    } catch (err: any) {
      alert('Erro ao salvar entrada: ' + err.message);
    }
  };

  const handleUpdateRevenue = async (id: string, updated: Partial<RevenueItem>) => {
    if (!isAdmin || !activeSheet) return;
    try {
      const res = await fetch(`/api/sheets/${activeSheet.id}/revenues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Falha ao atualizar entrada');
      const saved: RevenueItem = await res.json();

      setDatabase((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id === activeSheet.id) {
            return {
              ...s,
              revenues: s.revenues.map((r) => (r.id === id ? saved : r))
            };
          }
          return s;
        })
      }));
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!isAdmin || !activeSheet) return;
    try {
      const res = await fetch(`/api/sheets/${activeSheet.id}/revenues/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': user.role }
      });
      if (!res.ok) throw new Error('Falha ao remover entrada');

      setDatabase((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id === activeSheet.id) {
            return {
              ...s,
              revenues: s.revenues.filter((r) => r.id !== id)
            };
          }
          return s;
        })
      }));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // --- COSTS (DESPESAS) HANDLERS ---
  const handleAddCost = async (item: Partial<CostItem>) => {
    if (!isAdmin || !activeSheet) return;
    try {
      const res = await fetch(`/api/sheets/${activeSheet.id}/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Falha ao registrar despesa');
      const created: CostItem = await res.json();

      setDatabase((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id === activeSheet.id) {
            return {
              ...s,
              costs: [created, ...(s.costs || [])]
            };
          }
          return s;
        })
      }));
    } catch (err: any) {
      alert('Erro ao salvar despesa: ' + err.message);
    }
  };

  const handleUpdateCost = async (id: string, updated: Partial<CostItem>) => {
    if (!isAdmin || !activeSheet) return;
    try {
      const res = await fetch(`/api/sheets/${activeSheet.id}/costs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Falha ao atualizar despesa');
      const saved: CostItem = await res.json();

      setDatabase((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id === activeSheet.id) {
            return {
              ...s,
              costs: s.costs.map((c) => (c.id === id ? saved : c))
            };
          }
          return s;
        })
      }));
    } catch (err: any) {
      alert('Erro ao atualizar despesa: ' + err.message);
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!isAdmin || !activeSheet) return;
    try {
      const res = await fetch(`/api/sheets/${activeSheet.id}/costs/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': user.role }
      });
      if (!res.ok) throw new Error('Falha ao remover despesa');

      setDatabase((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => {
          if (s.id === activeSheet.id) {
            return {
              ...s,
              costs: s.costs.filter((c) => c.id !== id)
            };
          }
          return s;
        })
      }));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // --- CATEGORIES HANDLERS ---
  const handleAddCategory = async (category: Partial<CategoryDefinition>) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(category)
      });
      if (!res.ok) throw new Error('Falha ao criar categoria');
      const created: CategoryDefinition = await res.json();
      setDatabase((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          customCategories: [...(prev.settings.customCategories || []), created]
        }
      }));
    } catch (err: any) {
      alert('Erro ao criar categoria: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': user.role }
      });
      if (!res.ok) throw new Error('Falha ao remover categoria');
      setDatabase((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          customCategories: (prev.settings.customCategories || []).filter((c) => c.id !== id)
        }
      }));
    } catch (err: any) {
      alert('Erro ao remover categoria: ' + err.message);
    }
  };

  // --- USERS HANDLERS ---
  const handleCreateUser = async (userData: Partial<UserAccount>) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao registrar usuário');
      }
      const created = await res.json();
      setDatabase((prev) => ({
        ...prev,
        users: [...prev.users, created]
      }));
      alert('Usuário cadastrado com sucesso!');
    } catch (err: any) {
      alert('Erro ao cadastrar usuário: ' + err.message);
    }
  };

  const handleUpdateUserRole = async (id: string, role: 'admin' | 'user') => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Falha ao alterar perfil de usuário');
      setDatabase((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, role } : u))
      }));
    } catch (err: any) {
      alert('Erro ao alterar perfil: ' + err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': user.role }
      });
      if (!res.ok) throw new Error('Falha ao remover usuário');
      setDatabase((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== id)
      }));
    } catch (err: any) {
      alert('Erro ao remover usuário: ' + err.message);
    }
  };

  // --- SHEET & SETTINGS HANDLERS ---
  const handleCreateSheet = async (sheetData: {
    name: string;
    periodType: 'mensal' | 'semestral' | 'trimestral' | 'anual';
    year: number;
    month?: number;
    cloneFromId?: string;
  }) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(sheetData)
      });
      if (!res.ok) throw new Error('Falha ao criar novo período');
      const created: CostSheet = await res.json();
      setDatabase((prev) => ({
        ...prev,
        sheets: [created, ...prev.sheets]
      }));
      setActiveSheetId(created.id);
      setActiveTab('dashboard');
    } catch (err: any) {
      alert('Erro ao criar período: ' + err.message);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error('Falha ao salvar parâmetros');
      const saved = await res.json();
      setDatabase((prev) => ({ ...prev, settings: saved }));
    } catch (err: any) {
      alert('Erro ao atualizar configurações: ' + err.message);
    }
  };

  const handleResetDatabase = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'x-user-role': user.role }
      });
      if (!res.ok) throw new Error('Falha ao restaurar banco');
      await fetchData();
      alert('Dados restaurados para o padrão de demonstração!');
    } catch (err: any) {
      alert('Erro ao restaurar dados: ' + err.message);
    }
  };

  if (loading && !database.sheets.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">
        <div className="text-center space-y-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Carregando sistema financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sheets={database.sheets}
        activeSheetId={activeSheetId}
        setActiveSheetId={setActiveSheetId}
        onOpenNewSheet={() => setNewSheetModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        activeSheet={activeSheet}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          activeSheet={activeSheet}
          sheets={database.sheets}
          activeSheetId={activeSheetId}
          setActiveSheetId={setActiveSheetId}
          settings={database.settings}
          onOpenNewSheet={() => setNewSheetModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
        />

        {/* Dynamic Views Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {loadError && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>Configuração pendente:</strong> {loadError}
            </div>
          )}

          {!loading && database.sheets.length === 0 && activeTab !== 'control_panel' && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Base de dados vazia</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                Ainda não existem períodos, entradas ou despesas. Crie o primeiro período financeiro para começar.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setNewSheetModalOpen(true)}
                  className="mt-6 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Criar primeiro período
                </button>
              )}
            </div>
          )}

          {/* TAB 1: PAINEL GERAL */}
          {activeTab === 'dashboard' && activeSheet && (
            <DashboardView
              activeSheet={activeSheet}
              sheets={database.sheets}
              activeSheetId={activeSheetId}
              setActiveSheetId={setActiveSheetId}
              setActiveTab={setActiveTab}
              settings={database.settings}
            />
          )}

          {/* TAB 2: ENTRADAS */}
          {activeTab === 'entries' && activeSheet && (
            <EntriesView
              activeSheet={activeSheet}
              categories={categories}
              onAddRevenue={handleAddRevenue}
              onUpdateRevenue={handleUpdateRevenue}
              onDeleteRevenue={handleDeleteRevenue}
            />
          )}

          {/* TAB 3: DESPESAS */}
          {activeTab === 'expenses' && activeSheet && (
            <ExpensesView
              activeSheet={activeSheet}
              categories={categories}
              onAddCost={handleAddCost}
              onUpdateCost={handleUpdateCost}
              onDeleteCost={handleDeleteCost}
            />
          )}

          {/* TAB 4: PAINEL DE CONTROLE */}
          {activeTab === 'control_panel' && (
            <ControlPanelView
              settings={database.settings}
              users={database.users}
              categories={categories}
              sheets={database.sheets}
              activeSheet={activeSheet}
              onUpdateSettings={handleUpdateSettings}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onCreateUser={handleCreateUser}
              onUpdateUserRole={handleUpdateUserRole}
              onDeleteUser={handleDeleteUser}
              onResetDatabase={handleResetDatabase}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © {new Date().getFullYear()} {database.settings.companyName || 'Gestão Financeira'} • Sistema Simplificado de Obras & Empreitadas
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">
                Usuário: <strong className="text-slate-800 font-semibold">{user.name}</strong> (
                <span className={user.role === 'admin' ? 'text-blue-700 font-bold' : 'text-slate-600 font-bold'}>
                  {user.role === 'admin' ? 'Administrador' : 'Leitor'}
                </span>
                )
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth & Registration Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* New Sheet Period Modal */}
      <NewSheetModal
        isOpen={newSheetModalOpen}
        onClose={() => setNewSheetModalOpen(false)}
        sheets={database.sheets}
        onCreateSheet={handleCreateSheet}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={database.settings}
        onUpdateSettings={handleUpdateSettings}
        onResetData={handleResetDatabase}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
