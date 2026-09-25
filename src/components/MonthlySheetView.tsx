import React, { useState, useMemo } from 'react';
import { useAppDialog } from '../context/AppDialogContext.tsx';
import { 
  Plus, 
  Trash2, 
  Save, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Car, 
  Home, 
  Receipt, 
  CreditCard, 
  Wrench, 
  HardHat, 
  Calculator, 
  HelpCircle, 
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { CostSheet, CostItem, RevenueItem, FundExpenseItem } from '../types.ts';
import { formatCurrency, formatPercent } from '../utils/formatters.ts';
import { calculateSheetMetrics, CATEGORY_LABELS } from '../utils/calculations.ts';

interface MonthlySheetViewProps {
  sheet: CostSheet;
  onUpdateSheet: (updated: CostSheet) => Promise<void>;
  onDuplicateSheet?: () => void;
  onDeleteSheet?: () => void;
}

export const MonthlySheetView: React.FC<MonthlySheetViewProps> = ({
  sheet,
  onUpdateSheet,
  onDuplicateSheet,
  onDeleteSheet
}) => {
  const { isAdmin } = useAuth();
  const { showAlert } = useAppDialog();
  const [currentSheet, setCurrentSheet] = useState<CostSheet>(sheet);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | CostItem['category']>('all');

  // Sync state if prop changes
  React.useEffect(() => {
    setCurrentSheet(sheet);
  }, [sheet]);

  const metrics = calculateSheetMetrics(currentSheet);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await onUpdateSheet(currentSheet);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao salvar alterações na planilha.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Revenue Mutators ---
  const handleRevenueChange = (id: string, field: keyof RevenueItem, value: any) => {
    if (!isAdmin) return;
    const updatedRevenues = currentSheet.revenues.map((rev) => {
      if (rev.id === id) {
        return { ...rev, [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value };
      }
      return rev;
    });
    setCurrentSheet({ ...currentSheet, revenues: updatedRevenues });
  };

  const handleAddRevenue = () => {
    if (!isAdmin) return;
    const newRev: RevenueItem = {
      id: `rev-${Date.now()}`,
      client: 'NOVO CLIENTE / EMPRESA',
      amount: 0,
      status: 'pendente'
    };
    setCurrentSheet({ ...currentSheet, revenues: [...currentSheet.revenues, newRev] });
  };

  const handleDeleteRevenue = (id: string) => {
    if (!isAdmin) return;
    setCurrentSheet({
      ...currentSheet,
      revenues: currentSheet.revenues.filter((r) => r.id !== id)
    });
  };

  // --- Cost Mutators ---
  const handleCostChange = (id: string, field: keyof CostItem, value: any) => {
    if (!isAdmin) return;
    const updatedCosts = currentSheet.costs.map((cost) => {
      if (cost.id === id) {
        return { ...cost, [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value };
      }
      return cost;
    });
    setCurrentSheet({ ...currentSheet, costs: updatedCosts });
  };

  const handleAddCost = (category: CostItem['category']) => {
    if (!isAdmin) return;
    const newCost: CostItem = {
      id: `cost-${Date.now()}`,
      category,
      name: 'NOVO ITEM DE CUSTO',
      amount: 0
    };
    setCurrentSheet({ ...currentSheet, costs: [...currentSheet.costs, newCost] });
  };

  const handleDeleteCost = (id: string) => {
    if (!isAdmin) return;
    setCurrentSheet({
      ...currentSheet,
      costs: currentSheet.costs.filter((c) => c.id !== id)
    });
  };

  // --- Fund Expenses Mutators ---
  const handleFundExpenseChange = (id: string, field: keyof FundExpenseItem, value: any) => {
    if (!isAdmin) return;
    const updatedFund = currentSheet.fundExpenses.map((fe) => {
      if (fe.id === id) {
        return { ...fe, [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value };
      }
      return fe;
    });
    setCurrentSheet({ ...currentSheet, fundExpenses: updatedFund });
  };

  const handleAddFundExpense = () => {
    if (!isAdmin) return;
    const newFe: FundExpenseItem = {
      id: `fe-${Date.now()}`,
      name: 'NOVO GASTO DO FUNDO',
      amount: 0,
      notes: ''
    };
    setCurrentSheet({ ...currentSheet, fundExpenses: [...currentSheet.fundExpenses, newFe] });
  };

  const handleDeleteFundExpense = (id: string) => {
    if (!isAdmin) return;
    setCurrentSheet({
      ...currentSheet,
      fundExpenses: currentSheet.fundExpenses.filter((fe) => fe.id !== id)
    });
  };

  // --- Reconciliation Mutators ---
  const handleReconciliationChange = (field: string, value: any) => {
    if (!isAdmin) return;
    const numVal = field === 'notes' ? value : (value === '' ? 0 : Number(value));
    const oldRec = currentSheet.reconciliation || {
      accountBalance: 0,
      advances: 0,
      housingCosts: 0,
      fuelCosts: 0,
      otherDiffs: 0,
      calculatedDifference: 0
    };

    const newRec = {
      ...oldRec,
      [field]: numVal
    };

    if (field !== 'notes' && field !== 'calculatedDifference') {
      const totDeductions = (Number(newRec.advances) || 0) + (Number(newRec.housingCosts) || 0) + (Number(newRec.fuelCosts) || 0) + (Number(newRec.otherDiffs) || 0);
      newRec.calculatedDifference = (Number(newRec.accountBalance) || 0) - totDeductions;
    }

    setCurrentSheet({ ...currentSheet, reconciliation: newRec });
  };

  // Get Category Icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'carros': return <Car className="w-4 h-4 text-amber-600" />;
      case 'alojamento': return <Home className="w-4 h-4 text-blue-600" />;
      case 'impostos': return <Receipt className="w-4 h-4 text-rose-600" />;
      case 'cartao': return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'ferramentas': return <Wrench className="w-4 h-4 text-orange-600" />;
      case 'salarios': return <HardHat className="w-4 h-4 text-emerald-600" />;
      default: return <DollarSign className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Sheet Name, Status and Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
              {currentSheet.periodType} • {currentSheet.year}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              PLANILHA DE CUSTOS - {currentSheet.name}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Faturamento global, custos operacionais segregados, deduções do fundo de caixa e divisão entre sócios.
          </p>
        </div>

        {/* Action Controls for Admin */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          {isAdmin && (
            <>
              {onDuplicateSheet && (
                <button
                  onClick={onDuplicateSheet}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
                  title="Duplicar esta planilha como base para o próximo mês"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Duplicar Mês</span>
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </>
                )}
              </button>

              {onDeleteSheet && (
                <button
                  onClick={onDeleteSheet}
                  className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs transition cursor-pointer"
                  title="Excluir esta planilha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturamento */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Faturamento Total
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{currentSheet.revenues.length} fontes / empresas cadastradas</span>
          </div>
        </div>

        {/* Total de Custos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Custo Operacional Total
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {formatCurrency(metrics.totalCost)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{currentSheet.costs.length} despesas lançadas</span>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className={`bg-white border rounded-xl p-5 shadow-xs relative overflow-hidden ${
          metrics.netProfit >= 0 ? 'border-emerald-200' : 'border-rose-200'
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Lucro Líquido Operacional
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono ${
            metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {formatCurrency(metrics.netProfit)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span>Margem Líquida: </span>
            <span className={`font-bold font-mono ${metrics.marginPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatPercent(metrics.marginPercent)}
            </span>
          </div>
        </div>

        {/* Saldo Empresa Fundo */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Saldo em Conta / Fundo
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-1 font-mono">
              <input
                type="number"
                value={currentSheet.companyAccountFundBalance || ''}
                onChange={(e) => setCurrentSheet({ ...currentSheet, companyAccountFundBalance: Number(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xl sm:text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-slate-500 font-bold">€</span>
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-bold text-blue-700 font-mono">
              {formatCurrency(currentSheet.companyAccountFundBalance)}
            </div>
          )}
          <div className="text-xs text-slate-500 mt-2">
            Disponível em caixa de reserva
          </div>
        </div>
      </div>

      {/* Interactive Sheet Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar despesas, empresas ou categorias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Categorias
          </button>
          {(['carros', 'alojamento', 'impostos', 'cartao', 'ferramentas', 'salarios'] as CostItem['category'][]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat ? 'all' : cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition cursor-pointer ${
                selectedCategoryFilter === cat
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{CATEGORY_LABELS[cat] || cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Layout Matching the Spreadsheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Faturamento + Custos + Resumo de Lucros) - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: FATURAMENTO TOTAL */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400 font-bold" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  FATURAMENTO TOTAL
                </h3>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded">
                TOTAL: {formatCurrency(metrics.totalRevenue)}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="divide-y divide-slate-100">
                {currentSheet.revenues
                  .filter((rev) => searchQuery.trim() === '' || rev.client.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((rev) => (
                  <div key={rev.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      {isAdmin ? (
                        <input
                          type="text"
                          value={rev.client}
                          onChange={(e) => handleRevenueChange(rev.id, 'client', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Nome da Empresa / Cliente"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">{rev.client}</span>
                      )}
                    </div>

                    <div className="w-36 text-right font-mono">
                      {isAdmin ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={rev.amount ?? ''}
                            onChange={(e) => handleRevenueChange(rev.id, 'amount', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none pr-6"
                          />
                          <span className="absolute right-2 top-1 text-slate-400">€</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(rev.amount)}
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRevenue(rev.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Remover linha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && (
                <button
                  onClick={handleAddRevenue}
                  className="w-full mt-2 py-2 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Cliente / Faturamento
                </button>
              )}

              {/* Total Revenue Summary Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-lg text-xs font-bold">
                <span className="text-slate-700 uppercase tracking-wide">TOTAL DE FATURAMENTO</span>
                <span className="text-slate-900 font-mono text-sm">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Card: 1.0 - CUSTOS OPERACIONAIS */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  1.0 - CUSTOS OPERACIONAIS
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
                TOTAL: {formatCurrency(metrics.totalCost)}
              </span>
            </div>

            {/* Categorized cost tables */}
            <div className="p-4 space-y-4">
              {(['carros', 'alojamento', 'impostos', 'cartao', 'ferramentas', 'salarios'] as CostItem['category'][])
                .filter((catKey) => selectedCategoryFilter === 'all' || selectedCategoryFilter === catKey)
                .map((catKey) => {
                  const rawCosts = currentSheet.costs.filter((c) => c.category === catKey);
                  const catCosts = searchQuery.trim() === ''
                    ? rawCosts
                    : rawCosts.filter((c) => 
                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        CATEGORY_LABELS[catKey].toLowerCase().includes(searchQuery.toLowerCase())
                      );
                  const catTotal = rawCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);
                  const isCollapsed = !!collapsedCategories[catKey] && searchQuery.trim() === '';

                  if (searchQuery.trim() !== '' && catCosts.length === 0) {
                    return null;
                  }

                  return (
                    <div key={catKey} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                      {/* Category Header Bar */}
                      <div 
                        onClick={() => toggleCategory(catKey)}
                        className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between cursor-pointer border-b border-slate-100"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          {getCategoryIcon(catKey)}
                          <span>{CATEGORY_LABELS[catKey] || catKey.toUpperCase()}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({catCosts.length} {catCosts.length === 1 ? 'item' : 'itens'})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {formatCurrency(catTotal)}
                          </span>
                          {isCollapsed ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Category Items List */}
                      {!isCollapsed && (
                        <div className="p-3 space-y-2">
                          {catCosts.length === 0 ? (
                            <div className="text-center py-2 text-xs text-slate-400 italic">
                              Nenhum custo lançado nesta categoria.
                            </div>
                          ) : (
                            catCosts.map((cost) => (
                            <div key={cost.id} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0">
                              <div className="flex-1">
                                {isAdmin ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={cost.name}
                                      onChange={(e) => handleCostChange(cost.id, 'name', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                                      placeholder="Descrição do custo"
                                    />
                                    {cost.note !== undefined && (
                                      <input
                                        type="text"
                                        value={cost.note || ''}
                                        onChange={(e) => handleCostChange(cost.id, 'note', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="Nota (ex: Gasto tirar do fundo)"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium text-slate-800">{cost.name}</div>
                                    {cost.note && (
                                      <div className="text-[11px] text-amber-700 italic">{cost.note}</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="w-32 text-right font-mono">
                                {isAdmin ? (
                                  <div className="relative">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={cost.amount ?? ''}
                                      onChange={(e) => handleCostChange(cost.id, 'amount', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-rose-700 font-bold focus:ring-1 focus:ring-rose-500 outline-none pr-5 text-xs"
                                    />
                                    <span className="absolute right-1.5 top-1 text-slate-400 text-xs">€</span>
                                  </div>
                                ) : (
                                  <span className="font-semibold text-rose-700">
                                    {formatCurrency(cost.amount)}
                                  </span>
                                )}
                              </div>

                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteCost(cost.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                  title="Excluir custo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleAddCost(catKey)}
                            className="w-full mt-1.5 py-1 text-[11px] border border-dashed border-slate-200 hover:border-blue-400 rounded text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar item em {CATEGORY_LABELS[catKey]}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: 2.0 - RESUMO & FECHAMENTO */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2.0 - RESUMO FINANCEIRO
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">CUSTO TOTAL OPERACIONAL</span>
                <span className="font-mono text-sm text-slate-900">{formatCurrency(metrics.totalCost)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">FATURAMENTO TOTAL</span>
                <span className="font-mono text-sm text-slate-900">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-900 text-sm font-bold">LUCRO LÍQUIDO OPERACIONAL</span>
                <span className="font-mono text-base text-emerald-700 font-bold">
                  {formatCurrency(metrics.netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: RESUMO DE LUCROS & DIVISÃO DE SÓCIOS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  RESUMO DE LUCROS & DIVISÃO DE SÓCIOS
                </h3>
              </div>
              <span className="text-xs text-slate-500">4 Sócios (25% cada)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div className="text-[11px] text-slate-500 uppercase font-medium">Lucro Líquido</div>
                <div className="text-lg font-bold text-emerald-600 font-mono mt-1">
                  {formatCurrency(metrics.netProfit)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div className="text-[11px] text-slate-500 uppercase font-medium">Divisão por Sócio</div>
                <div className="text-lg font-bold text-slate-800 font-mono mt-1">
                  {formatCurrency(metrics.netProfit > 0 ? metrics.netProfit / (currentSheet.partners.length || 4) : 0)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div className="text-[11px] text-slate-500 uppercase font-medium">Valor a Depositar Total</div>
                <div className="text-lg font-bold text-blue-700 font-mono mt-1">
                  {formatCurrency(Math.max(0, metrics.netProfit))}
                </div>
              </div>
            </div>

            {/* Individual Partner Details */}
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {metrics.partnerAllocations.map((p, idx) => (
                <div key={p.partnerId} className="px-3.5 py-2 flex items-center justify-between text-xs bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{p.name} ({p.percentage}%)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Gastos do Fundo + Conciliação Bancária + Reservas) - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: GASTOS DO FUNDO */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  GASTOS DO FUNDO
                </h3>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded">
                TOTAL: {formatCurrency(metrics.totalFundExpenses)}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="divide-y divide-slate-100">
                {currentSheet.fundExpenses.map((fe) => (
                  <div key={fe.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1">
                      {isAdmin ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={fe.name}
                            onChange={(e) => handleFundExpenseChange(fe.id, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Descrição do gasto"
                          />
                          {fe.notes !== undefined && (
                            <input
                              type="text"
                              value={fe.notes || ''}
                              onChange={(e) => handleFundExpenseChange(fe.id, 'notes', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="Observação"
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-800">{fe.name}</div>
                          {fe.notes && <div className="text-[10px] text-slate-500 italic">{fe.notes}</div>}
                        </div>
                      )}
                    </div>

                    <div className="w-28 text-right font-mono">
                      {isAdmin ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={fe.amount ?? ''}
                            onChange={(e) => handleFundExpenseChange(fe.id, 'amount', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-900 font-bold focus:ring-1 focus:ring-blue-500 outline-none pr-5 text-xs"
                          />
                          <span className="absolute right-1.5 top-1 text-slate-400 text-xs">€</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900">{formatCurrency(fe.amount)}</span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteFundExpense(fe.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                        title="Remover gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && (
                <button
                  onClick={handleAddFundExpense}
                  className="w-full mt-2 py-1.5 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Gasto do Fundo
                </button>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold text-slate-800">
                <span>TOTAL GASTOS DO FUNDO</span>
                <span className="font-mono text-sm">{formatCurrency(metrics.totalFundExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Card: CONCILIAÇÃO BANCÁRIA */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  CONCILIAÇÃO BANCÁRIA & DIFERENÇAS
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Validação de Conta</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Valor na Conta */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-700 font-medium">VALOR NA CONTA:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={currentSheet.reconciliation?.accountBalance ?? ''}
                      onChange={(e) => handleReconciliationChange('accountBalance', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-900 font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(currentSheet.reconciliation?.accountBalance)}
                    </span>
                  )}
                </div>
              </div>

              {/* Vales Feitos */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">VALES FEITOS:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={currentSheet.reconciliation?.advances ?? ''}
                      onChange={(e) => handleReconciliationChange('advances', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      {formatCurrency(currentSheet.reconciliation?.advances)}
                    </span>
                  )}
                </div>
              </div>

              {/* Custos do Alojamento */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">CUSTOS DO ALOJAMENTO:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={currentSheet.reconciliation?.housingCosts ?? ''}
                      onChange={(e) => handleReconciliationChange('housingCosts', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      {formatCurrency(currentSheet.reconciliation?.housingCosts)}
                    </span>
                  )}
                </div>
              </div>

              {/* Combustível */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">COMBUSTÍVEL:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={currentSheet.reconciliation?.fuelCosts ?? ''}
                      onChange={(e) => handleReconciliationChange('fuelCosts', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      {formatCurrency(currentSheet.reconciliation?.fuelCosts)}
                    </span>
                  )}
                </div>
              </div>

              {/* Diferença Apurada */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 uppercase">DIFERENÇA APURADA EM CONTA:</span>
                <span className="font-mono text-base font-bold text-blue-700">
                  {formatCurrency(metrics.calculatedDifferenceInAccount)}
                </span>
              </div>

              {/* Notes */}
              <div className="mt-2">
                <label className="block text-[11px] text-slate-500 mb-1">Notas de Conciliação:</label>
                {isAdmin ? (
                  <textarea
                    rows={2}
                    value={currentSheet.reconciliation?.notes || ''}
                    onChange={(e) => handleReconciliationChange('notes', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Diferença de 5.355 € apurada em conta em Janeiro..."
                  />
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                    {currentSheet.reconciliation?.notes || 'Nenhuma observação informada.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: RESERVA CONSIGNADA & PROVISÕES FISCAIS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                RESERVA CONSIGNADA & PROVISÕES FISCAIS
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Fundo de Reserva / Caixa:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={currentSheet.fundValueReserve ?? ''}
                      onChange={(e) => setCurrentSheet({ ...currentSheet, fundValueReserve: Number(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-900 font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(currentSheet.fundValueReserve)}
                    </span>
                  )}
                </div>
              </div>

              {currentSheet.ircEstimatedTax !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">IRC da Empresa (Estimado):</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {formatCurrency(currentSheet.ircEstimatedTax)}
                  </span>
                </div>
              )}

              {currentSheet.consignationReserveNote && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium leading-relaxed">
                  📌 {currentSheet.consignationReserveNote}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
