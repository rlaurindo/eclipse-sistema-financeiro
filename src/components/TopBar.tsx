import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Settings, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Plus, 
  Download, 
  Calendar, 
  Layers, 
  Sparkles, 
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Zap,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { CostSheet, ActiveTab, SystemSettings } from '../types.ts';
import { exportSheetToExcel } from '../utils/formatters.ts';

interface TopBarProps {
  activeTab: ActiveTab;
  activeSheet?: CostSheet;
  sheets?: CostSheet[];
  activeSheetId?: string;
  setActiveSheetId?: (id: string) => void;
  settings: SystemSettings;
  onOpenNewSheet: () => void;
  onOpenSettings: () => void;
  onOpenAuthModal: () => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Painel Geral',
    subtitle: 'Faturamento consolidado, valor em conta corrente, balanço e despesas'
  },
  entries: {
    title: 'Entradas & Faturamento',
    subtitle: 'Formulário de registro de entradas e listagem dos valores imputados'
  },
  expenses: {
    title: 'Despesas & Gastos Operacionais',
    subtitle: 'Lançamento de despesas e tabela de custos do período'
  },
  control_panel: {
    title: 'Painel de Controle',
    subtitle: 'Gerenciamento de categorias, usuários, saldos bancários e quotas societárias'
  }
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  activeSheet,
  sheets = [],
  activeSheetId,
  setActiveSheetId,
  settings,
  onOpenNewSheet,
  onOpenSettings,
  onOpenAuthModal
}) => {
  const { user, isAdmin, viewPreferences, togglePrivacyMode } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const info = tabTitles[activeTab] || { title: 'Gestão Financeira', subtitle: '' };

  const currentIndex = useMemo(() => {
    if (!activeSheetId || sheets.length === 0) return -1;
    return sheets.findIndex((s) => s.id === activeSheetId);
  }, [sheets, activeSheetId]);

  const handlePrevSheet = () => {
    if (!setActiveSheetId || currentIndex <= 0) return;
    setActiveSheetId(sheets[currentIndex - 1].id);
  };

  const handleNextSheet = () => {
    if (!setActiveSheetId || currentIndex === -1 || currentIndex >= sheets.length - 1) return;
    setActiveSheetId(sheets[currentIndex + 1].id);
  };

  const august2026Sheet = sheets.find((s) => s.id === 'sheet-ago-2026' || (s.year === 2026 && s.month === 8));
  const isAugust2026 = Boolean(
    activeSheet &&
    ((august2026Sheet && activeSheet.id === august2026Sheet.id) ||
      (activeSheet.year === 2026 && activeSheet.month === 8))
  );

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Context Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
              {info.title}
            </h1>
            {activeSheet && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200 shrink-0">
                <Calendar className="w-3 h-3 text-slate-500" />
                {activeSheet.name}
              </span>
            )}
            {isAugust2026 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 shrink-0">
                <Zap className="w-3 h-3 text-emerald-600" />
                MÊS CORRENTE (AGO/2026)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
            {info.subtitle}
          </p>
        </div>

        {/* Center/Right Period Filter Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Quick Period Stepper & Dropdown */}
          {sheets.length > 0 && setActiveSheetId && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 text-xs font-semibold shadow-2xs">
              <button
                onClick={handlePrevSheet}
                disabled={currentIndex <= 0}
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white rounded-lg transition cursor-pointer"
                title="Período Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-slate-900 font-bold hover:bg-white rounded-lg transition cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[130px] truncate">{activeSheet?.name || 'Período'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 max-h-72 overflow-y-auto"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                      <span>Selecionar Período</span>
                      <span>{sheets.length} planilhas</span>
                    </div>
                    {sheets.map((s) => {
                      const isAgo = s.id === 'sheet-ago-2026' || (s.year === 2026 && s.month === 8);
                      const isSelected = s.id === activeSheetId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setActiveSheetId(s.id)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                            isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-semibold flex items-center gap-1">
                              <span>{s.name}</span>
                              {isAgo && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">
                                  AGO/26
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {s.periodType.toUpperCase()} • {s.year}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleNextSheet}
                disabled={currentIndex === -1 || currentIndex >= sheets.length - 1}
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white rounded-lg transition cursor-pointer"
                title="Próximo Período"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Jump to Agosto 2026 quick button if available and not selected */}
          {august2026Sheet && !isAugust2026 && setActiveSheetId && (
            <button
              onClick={() => setActiveSheetId(august2026Sheet.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Alternar imediatamente para o mês de Agosto 2026"
            >
              <Zap className="w-3 h-3 text-emerald-600" />
              <span className="hidden sm:inline">Agosto 2026</span>
              <span className="sm:hidden">Ago/26</span>
            </button>
          )}

          {/* Privacy Mode Quick Toggle */}
          <button
            onClick={togglePrivacyMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              viewPreferences.privacyMode
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={viewPreferences.privacyMode ? 'Mostrar Valores Numéricos' : 'Ocultar Valores (Modo Privacidade)'}
          >
            {viewPreferences.privacyMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Valores Ocultos</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Ocultar Valores</span>
              </>
            )}
          </button>

          {/* New Period Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={onOpenNewSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Período</span>
              <span className="sm:hidden">+ Novo</span>
            </button>
          )}

          {/* Export Sheet */}
          {activeSheet && (
            <button
              onClick={() => exportSheetToExcel(activeSheet)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Exportar Planilha Ativa em Excel (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar</span>
            </button>
          )}

          {/* Settings Button */}
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer shrink-0"
              title="Configurações do Sistema"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
