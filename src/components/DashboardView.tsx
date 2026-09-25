import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Users, 
  PieChart, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  Plus, 
  Zap,
  ArrowRight,
  Receipt,
  CreditCard,
  Layers
} from 'lucide-react';
import { CostSheet, SystemSettings, RevenueItem, CostItem, ActiveTab } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardViewProps {
  activeSheet: CostSheet;
  sheets: CostSheet[];
  activeSheetId: string;
  setActiveSheetId: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  settings: SystemSettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeSheet,
  sheets,
  activeSheetId,
  setActiveSheetId,
  setActiveTab,
  settings
}) => {
  const { formatCurrency, viewPreferences, isAdmin } = useAuth();

  // Calculations for active period
  const totalRevenues = useMemo(() => {
    return (activeSheet?.revenues || []).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [activeSheet]);

  const receivedRevenues = useMemo(() => {
    return (activeSheet?.revenues || [])
      .filter((r) => r.status === 'pago' || !r.status)
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [activeSheet]);

  const pendingRevenues = useMemo(() => {
    return (activeSheet?.revenues || [])
      .filter((r) => r.status === 'pendente' || r.status === 'previsto')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [activeSheet]);

  const totalCosts = useMemo(() => {
    return (activeSheet?.costs || []).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  }, [activeSheet]);

  const netBalance = totalRevenues - totalCosts;
  const profitMargin = totalRevenues > 0 ? (netBalance / totalRevenues) * 100 : 0;

  // Conta corrente balance (sheet specific or global fallback)
  const accountCurrentBalance = activeSheet?.companyAccountFundBalance || settings?.accountCurrentBalance || 0;

  // Breakdown by categories
  const costsByCategory = useMemo(() => {
    const map: Record<string, { label: string; amount: number; count: number; color: string }> = {
      salarios: { label: 'Salários & Equipes', amount: 0, count: 0, color: 'bg-cyan-500 text-cyan-700' },
      carros: { label: 'Carros & Carrinhas', amount: 0, count: 0, color: 'bg-blue-500 text-blue-700' },
      impostos: { label: 'Impostos & NISS', amount: 0, count: 0, color: 'bg-red-500 text-red-700' },
      alojamento: { label: 'Alojamento & Estadias', amount: 0, count: 0, color: 'bg-purple-500 text-purple-700' },
      cartao: { label: 'Cartão & Bancos', amount: 0, count: 0, color: 'bg-amber-500 text-amber-700' },
      ferramentas: { label: 'Ferramentas & EPIs', amount: 0, count: 0, color: 'bg-emerald-500 text-emerald-700' },
      outros: { label: 'Outros Custos', amount: 0, count: 0, color: 'bg-slate-500 text-slate-700' }
    };

    (activeSheet?.costs || []).forEach((c) => {
      const catKey = (c.category || 'outros').toLowerCase();
      if (!map[catKey]) {
        map[catKey] = { label: c.category.toUpperCase(), amount: 0, count: 0, color: 'bg-indigo-500 text-indigo-700' };
      }
      map[catKey].amount += Number(c.amount) || 0;
      map[catKey].count += 1;
    });

    return Object.entries(map)
      .filter(([_, data]) => data.amount > 0)
      .sort((a, b) => b[1].amount - a[1].amount);
  }, [activeSheet]);

  // Combined recent movements
  const recentMovements = useMemo(() => {
    const revs = (activeSheet?.revenues || []).map((r) => ({
      id: r.id,
      type: 'entry' as const,
      name: r.client,
      sub: r.category || r.project || 'Faturamento',
      amount: r.amount,
      status: r.status || 'pago',
      date: r.date || 'Agosto 2026'
    }));

    const costs = (activeSheet?.costs || []).map((c) => ({
      id: c.id,
      type: 'expense' as const,
      name: c.name,
      sub: c.category.toUpperCase(),
      amount: c.amount,
      status: 'pago' as const,
      date: c.date || 'Agosto 2026'
    }));

    return [...revs, ...costs].slice(0, 8);
  }, [activeSheet]);

  // Partner distribution share
  const partnerList = useMemo(() => {
    if (activeSheet?.partners && activeSheet.partners.length > 0) {
      return activeSheet.partners;
    }
    return (settings?.partners || [
      { id: '1', name: 'SÓCIO 1', percentage: 25 },
      { id: '2', name: 'SÓCIO 2', percentage: 25 },
      { id: '3', name: 'SÓCIO 3', percentage: 25 },
      { id: '4', name: 'SÓCIO 4', percentage: 25 }
    ]).map((p) => ({
      id: p.id,
      name: p.name,
      percentage: p.percentage,
      amount: netBalance > 0 ? (netBalance * p.percentage) / 100 : 0
    }));
  }, [activeSheet, settings, netBalance]);

  const isAugust2026 = activeSheet?.id === 'sheet-ago-2026' || (activeSheet?.year === 2026 && activeSheet?.month === 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Month Selector Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Visão Financeira Geral
            </span>
            {isAugust2026 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                Mês Ativo
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{activeSheet?.name || 'Período Contábil'}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Acompanhe o faturamento, despesas operacionais, balanço líquido e saldo disponível da empresa.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('entries')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Nova Entrada</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Nova Despesa</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 MAIN KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturamento */}
        <div 
          onClick={() => setActiveTab('entries')}
          className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Faturamento
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalRevenues)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Recebido: {formatCurrency(receivedRevenues)}
              </span>
              {pendingRevenues > 0 && (
                <span className="text-amber-600 font-medium">
                  {formatCurrency(pendingRevenues)} pendente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Despesas */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Despesas Totais
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight text-red-600">
              {formatCurrency(totalCosts)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{activeSheet?.costs?.length || 0} lançamentos</span>
              <span className="text-red-600 font-semibold flex items-center gap-1">
                Ver detalhes <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Balanço / Saldo Líquido */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Balanço Líquido
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${
              netBalance >= 0 ? 'text-blue-700' : 'text-rose-600'
            }`}>
              {formatCurrency(netBalance)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Margem Líquida:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                profitMargin >= 20 ? 'bg-emerald-100 text-emerald-800' :
                profitMargin > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Disponível em Conta Corrente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conta Corrente & Caixa
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight text-purple-700">
              {formatCurrency(accountCurrentBalance)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 text-slate-600">
                <Building2 className="w-3 h-3 text-purple-600" /> Saldo Tesouraria
              </span>
              <span className="text-emerald-700 font-bold">Disponível</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: BREAKDOWNS & MOVEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Financial Comparison & Category Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Cashflow Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Desempenho Financeiro do Mês
                </h3>
                <p className="text-xs text-slate-500">
                  Relação proporcional entre Faturamento e Despesas Operacionais
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {formatCurrency(totalRevenues)}
              </span>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Entradas (Faturamento)
                  </span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalRevenues)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-red-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    Saídas (Despesas Operacionais)
                  </span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(totalCosts)} ({totalRevenues > 0 ? ((totalCosts / totalRevenues) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, totalRevenues > 0 ? (totalCosts / totalRevenues) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Resultado Líquido do Mês:</span>
              <span className={`font-black text-sm ${netBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </span>
            </div>
          </div>

          {/* Despesas por Categoria */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  Distribuição de Despesas por Categoria
                </h3>
                <p className="text-xs text-slate-500">
                  Principais centros de custos lançados em {activeSheet?.name}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
              >
                Ver Todas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {costsByCategory.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Nenhuma despesa cadastrada neste mês.
              </div>
            ) : (
              <div className="space-y-3">
                {costsByCategory.map(([catKey, cat]) => {
                  const pct = totalCosts > 0 ? (cat.amount / totalCosts) * 100 : 0;
                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{cat.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(cat.amount)}</span>
                          <span className="text-[10px] text-slate-500 w-10 text-right">({pct.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${cat.color.split(' ')[0]}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Partner Profit Distribution & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Divisão dos Sócios */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Divisão de Lucros (Sócios)
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                {partnerList.length} Sócios
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cálculo automático das cotas societárias sobre o lucro líquido apurado ({formatCurrency(netBalance)}).
            </p>

            <div className="space-y-2.5">
              {partnerList.map((partner) => {
                const partnerAmount = netBalance > 0 ? (netBalance * partner.percentage) / 100 : 0;
                return (
                  <div 
                    key={partner.id} 
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-[10px]">
                        {partner.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{partner.name}</div>
                        <div className="text-[10px] text-slate-500">Cota: {partner.percentage}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {formatCurrency(partnerAmount)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        {netBalance > 0 ? 'Disponível' : 'Sem Lucro'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Últimas Movimentações */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                Últimos Registros
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {activeSheet?.name}
              </span>
            </div>

            {recentMovements.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Nenhuma movimentação registrada neste período.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentMovements.map((mov) => (
                  <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        mov.type === 'entry' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {mov.type === 'entry' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{mov.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{mov.sub}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-mono font-bold ${
                        mov.type === 'entry' ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        {mov.type === 'entry' ? '+' : '-'}{formatCurrency(mov.amount)}
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        mov.status === 'pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {mov.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
