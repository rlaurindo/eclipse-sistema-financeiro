import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sliders, 
  Calendar, 
  Zap, 
  Search, 
  ChevronDown, 
  Check, 
  Plus, 
  LogOut, 
  User, 
  ShieldCheck, 
  Eye, 
  Menu, 
  X,
  Wallet,
  Building2
} from 'lucide-react';
import { ActiveTab, CostSheet } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DeveloperCredit } from './DeveloperCredit.tsx';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sheets: CostSheet[];
  activeSheetId: string;
  setActiveSheetId: (id: string) => void;
  onOpenNewSheet: () => void;
  onOpenSettings: () => void;
  onOpenAuthModal: () => void;
  activeSheet?: CostSheet;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sheets,
  activeSheetId,
  setActiveSheetId,
  onOpenNewSheet,
  onOpenSettings,
  onOpenAuthModal,
  activeSheet
}) => {
  const { user, isAdmin, logout } = useAuth();
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<'ALL' | number>('ALL');

  // Extract unique years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(sheets.map((s) => Number(s.year)).filter((y) => !isNaN(y) && y > 0)));
    return years.sort((a: number, b: number) => b - a);
  }, [sheets]);

  // Filter sheets by search and year
  const filteredSheets = useMemo(() => {
    return sheets.filter((s) => {
      const matchesSearch = sheetSearchQuery.trim() === '' || 
        s.name.toLowerCase().includes(sheetSearchQuery.toLowerCase()) ||
        s.year.toString().includes(sheetSearchQuery);
      const matchesYear = selectedYearFilter === 'ALL' || s.year === selectedYearFilter;
      return matchesSearch && matchesYear;
    });
  }, [sheets, sheetSearchQuery, selectedYearFilter]);

  const august2026Sheet = sheets.find((s) => s.id === 'sheet-ago-2026' || (s.year === 2026 && s.month === 8));
  const isAugust2026Active = activeSheet?.id === august2026Sheet?.id || (activeSheet?.year === 2026 && activeSheet?.month === 8);

  const navigationItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Painel Geral',
      description: 'Faturamento, saldo e balanço',
      icon: LayoutDashboard,
      badge: 'Visão Geral',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'entries' as ActiveTab,
      label: 'Entradas',
      description: 'Registro e tabela de faturamento',
      icon: ArrowDownLeft,
      badge: 'Receitas',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Despesas',
      description: 'Registro e tabela de custos',
      icon: ArrowUpRight,
      badge: 'Custos',
      badgeColor: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      id: 'control_panel' as ActiveTab,
      label: 'Painel de Controle',
      description: 'Categorias, usuários & ajustes',
      icon: Sliders,
      badge: 'Gestão',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ].filter((item) => {
    if (isAdmin) return true;
    return item.id === 'dashboard';
  });

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            GF
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              Gestão Financeira
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {activeSheet?.name || 'Nenhum período'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAuthModal}
            className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold cursor-pointer"
          >
            {user.role.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main Sidebar Container */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-white border-r border-slate-200
          flex flex-col justify-between
          transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-xl lg:shadow-none
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  GF
                </div>
                <div>
                  <h1 className="text-sm font-black text-slate-900 leading-none tracking-tight">
                    Gestão Financeira
                  </h1>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Obras & Prestação de Serviços
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QUICK AUGUST 2026 SHORTCUT BADGE */}
            {august2026Sheet && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setActiveSheetId(august2026Sheet.id);
                    setSheetDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                    isAugust2026Active
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${isAugust2026Active ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span>Mês: <strong>AGOSTO 2026</strong></span>
                  </div>
                  {isAugust2026Active ? (
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded">
                      ATIVO
                    </span>
                  ) : (
                    <span className="text-[10px] text-blue-600 font-semibold">Ir para Mês</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* PERIOD / MONTH SELECTION ACCORDION */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Filtro de Mês / Período
              </label>
              {isAdmin && (
                <button
                  onClick={onOpenNewSheet}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Criar Novo Mês Contábil"
                >
                  <Plus className="w-3 h-3" /> Novo
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setSheetDropdownOpen(!sheetDropdownOpen)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-left flex items-center justify-between text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">{activeSheet?.name || 'Selecione o mês'}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${sheetDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Sheet Dropdown Menu */}
              {sheetDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-2 max-h-72 overflow-y-auto">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar mês..."
                      value={sheetSearchQuery}
                      onChange={(e) => setSheetSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Year Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setSelectedYearFilter('ALL')}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer whitespace-nowrap ${
                        selectedYearFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos
                    </button>
                    {availableYears.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYearFilter(yr)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer whitespace-nowrap ${
                          selectedYearFilter === yr
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>

                  {/* List of Sheets */}
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {filteredSheets.length === 0 ? (
                      <div className="py-3 text-center text-xs text-slate-400">
                        Nenhum mês encontrado.
                      </div>
                    ) : (
                      filteredSheets.map((s) => {
                        const isCurrent = s.id === activeSheetId;
                        const isAug = s.id === 'sheet-ago-2026' || (s.year === 2026 && s.month === 8);
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveSheetId(s.id);
                              setSheetDropdownOpen(false);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full py-2 px-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isAug && <Zap className="w-3 h-3 text-amber-500 shrink-0" />}
                              <span className="truncate">{s.name}</span>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MAIN 4 NAVIGATION ITEMS */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Módulos Principais
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs leading-tight truncate">
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && !isActive && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* USER INFO & FOOTER ACTIONS */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60">
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate leading-none">
                    {user.name}
                  </div>
                  <span className={`text-[9px] font-black uppercase inline-block mt-0.5 ${
                    isAdmin ? 'text-blue-600' : 'text-slate-500'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Leitor'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenAuthModal}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                  title="Trocar Perfil / Login"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <DeveloperCredit compact className="mt-3" />
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs"
        />
      )}
    </>
  );
};
