import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Building2, 
  Award, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  DollarSign, 
  PieChart as PieIcon, 
  Download, 
  Eye, 
  EyeOff, 
  Printer, 
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { CostSheet, SystemSettings, InvoicingCycle } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PartnerSummaryViewProps {
  sheets: CostSheet[];
  activeSheet: CostSheet;
  settings: SystemSettings;
  invoicingMatrix: InvoicingCycle[];
  onSelectSheet?: (sheetId: string) => void;
}

export const PartnerSummaryView: React.FC<PartnerSummaryViewProps> = ({
  sheets,
  activeSheet,
  settings,
  invoicingMatrix,
  onSelectSheet
}) => {
  const { viewPreferences, togglePrivacyMode } = useAuth();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'period' | 'consolidated'>('period');

  // Value mask helper
  const displayVal = (amount: number) => {
    if (viewPreferences.privacyMode) return '•••••• €';
    return formatCurrency(amount);
  };

  // Compute active sheet metrics
  const activeRevenue = activeSheet.revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const activeCost = activeSheet.costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const activeOperatingMargin = activeRevenue - activeCost;
  const activeFundReserve = Number(activeSheet.fundValueReserve) || 0;
  const activeIrc = Number(activeSheet.ircEstimatedTax) || (activeOperatingMargin > 0 ? (activeOperatingMargin * (settings.defaultIrcRate || 21)) / 100 : 0);
  const activeNetDistributable = Math.max(0, activeOperatingMargin - activeFundReserve - activeIrc);

  // Compute consolidated metrics across all sheets
  const totalConsolidatedRevenue = sheets.reduce(
    (acc, s) => acc + s.revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    0
  );
  const totalConsolidatedCost = sheets.reduce(
    (acc, s) => acc + s.costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
    0
  );
  const totalConsolidatedOperatingMargin = totalConsolidatedRevenue - totalConsolidatedCost;
  const totalConsolidatedFundReserves = sheets.reduce((acc, s) => acc + (Number(s.fundValueReserve) || 0), 0);
  const totalConsolidatedIrc = sheets.reduce((acc, s) => acc + (Number(s.ircEstimatedTax) || 0), 0);
  const totalConsolidatedNetDistributable = Math.max(
    0,
    totalConsolidatedOperatingMargin - totalConsolidatedFundReserves - totalConsolidatedIrc
  );

  // Determine current scope metrics
  const isConsolidated = viewScope === 'consolidated';
  const currentRevenue = isConsolidated ? totalConsolidatedRevenue : activeRevenue;
  const currentCost = isConsolidated ? totalConsolidatedCost : activeCost;
  const currentOperatingMargin = isConsolidated ? totalConsolidatedOperatingMargin : activeOperatingMargin;
  const currentFundReserve = isConsolidated ? totalConsolidatedFundReserves : activeFundReserve;
  const currentIrc = isConsolidated ? totalConsolidatedIrc : activeIrc;
  const currentNetDistributable = isConsolidated ? totalConsolidatedNetDistributable : activeNetDistributable;
  const currentMarginPercentage = currentRevenue > 0 ? (currentOperatingMargin / currentRevenue) * 100 : 0;

  // Active partners configuration
  const currentPartners = activeSheet.partners && activeSheet.partners.length > 0
    ? activeSheet.partners
    : settings.partners.map((p) => ({
        id: p.id,
        name: p.name,
        percentage: p.percentage,
        amount: (currentNetDistributable * p.percentage) / 100
      }));

  // Calculate cumulative profit per partner across all sheets
  const partnerCumulativeMap: Record<string, { totalAmount: number; name: string; percentage: number }> = {};
  
  settings.partners.forEach((p) => {
    partnerCumulativeMap[p.name] = { totalAmount: 0, name: p.name, percentage: p.percentage };
  });

  sheets.forEach((sheet) => {
    const sRev = sheet.revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const sCost = sheet.costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const sFund = Number(sheet.fundValueReserve) || 0;
    const sIrc = Number(sheet.ircEstimatedTax) || 0;
    const sNet = Math.max(0, sRev - sCost - sFund - sIrc);

    if (sheet.partners && sheet.partners.length > 0) {
      sheet.partners.forEach((pt) => {
        if (!partnerCumulativeMap[pt.name]) {
          partnerCumulativeMap[pt.name] = { totalAmount: 0, name: pt.name, percentage: pt.percentage };
        }
        partnerCumulativeMap[pt.name].totalAmount += Number(pt.amount) || (sNet * pt.percentage) / 100;
      });
    } else {
      settings.partners.forEach((p) => {
        if (partnerCumulativeMap[p.name]) {
          partnerCumulativeMap[p.name].totalAmount += (sNet * p.percentage) / 100;
        }
      });
    }
  });

  // Filter partners based on dropdown
  const filteredPartners = selectedPartnerId === 'all'
    ? currentPartners
    : currentPartners.filter((p) => p.name === selectedPartnerId || p.id === selectedPartnerId);

  // Print executive report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 text-amber-700 border border-amber-200 rounded-2xl">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Relatório Resumido para Sócios
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  Visão Executiva de Cotas
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                  {settings.companyName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Demonstrativo de faturamento bruto, custos operacionais, provisões fiscais e rateio de lucros líquidos aos cotistas.
              </p>
            </div>
          </div>

          {/* Controls: Scope Switcher, Partner Filter, Privacy, Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period vs Consolidated switch */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewScope('period')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewScope === 'period'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeSheet.name}</span>
              </button>
              <button
                onClick={() => setViewScope('consolidated')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewScope === 'consolidated'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Consolidado Geral ({sheets.length})</span>
              </button>
            </div>

            {/* Filter by Partner */}
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
            >
              <option value="all">👥 Todos os Sócios (Visão Geral)</option>
              {settings.partners.map((p) => (
                <option key={p.id} value={p.name}>
                  👤 {p.name} ({p.percentage}%)
                </option>
              ))}
            </select>

            {/* Toggle Privacy Mode */}
            <button
              onClick={togglePrivacyMode}
              className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                viewPreferences.privacyMode
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={viewPreferences.privacyMode ? 'Mostrar Valores' : 'Modo Privacidade (Ocultar Valores)'}
            >
              {viewPreferences.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              title="Imprimir Relatório Executivo de Sócios"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Global Financial Flow Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              Faturamento Bruto
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
              {displayVal(currentRevenue)}
            </div>
            <div className="text-[10px] text-slate-500">
              {isConsolidated ? 'Soma de todas as medições' : 'Medições e faturas do mês'}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-rose-600" />
              Custos Operacionais
            </div>
            <div className="text-base sm:text-lg font-black text-rose-700 font-mono">
              {displayVal(currentCost)}
            </div>
            <div className="text-[10px] text-slate-500">
              Viaturas, alojamentos, salários
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-indigo-600" />
              Margem Operacional
            </div>
            <div className="text-base sm:text-lg font-black text-indigo-900 font-mono">
              {displayVal(currentOperatingMargin)}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              Margem: {currentMarginPercentage.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3 h-3 text-amber-600" />
              Fundo de Caixa
            </div>
            <div className="text-base sm:text-lg font-black text-amber-800 font-mono">
              {displayVal(currentFundReserve)}
            </div>
            <div className="text-[10px] text-slate-500">
              Reserva de contingências
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              Provisão IRC
            </div>
            <div className="text-base sm:text-lg font-black text-purple-900 font-mono">
              {displayVal(currentIrc)}
            </div>
            <div className="text-[10px] text-slate-500">
              Imposto estimado ({settings.defaultIrcRate}%)
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-700" />
              Líquido Sócios
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-900 font-mono">
              {displayVal(currentNetDistributable)}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">
              Disponível para rateio
            </div>
          </div>
        </div>
      </div>

      {/* Partner Quota Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">
              Quotas Societárias & Distribuição de Dividendos
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {filteredPartners.length} {filteredPartners.length === 1 ? 'sócio exibido' : 'sócios no quadro'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPartners.map((partner) => {
            const partnerCalculatedAmount = (currentNetDistributable * partner.percentage) / 100;
            const cumulativeInfo = partnerCumulativeMap[partner.name] || { totalAmount: partnerCalculatedAmount };

            return (
              <div
                key={partner.id || partner.name}
                className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs transition-all space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none opacity-60"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {partner.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm leading-tight">
                        {partner.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Cota Societária: <strong className="text-amber-700 font-bold">{partner.percentage}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {isConsolidated ? 'Cota Consolidada:' : `Cota ${activeSheet.name}:`}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {displayVal(partnerCalculatedAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Acumulado Histórico:</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {displayVal(cumulativeInfo.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Status de Pagamento:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Liquidado / Aprovado
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Section: Comparison & Performance por Obra */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Rentabilidade por Empreitada/Cliente */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Faturamento & Contribuição por Cliente / Obra ({activeSheet.name})
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              {activeSheet.revenues.length} clientes faturados
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5 text-left">Cliente / Contratante</th>
                  <th className="px-3.5 py-2.5 text-left">Projeto / Obra</th>
                  <th className="px-3.5 py-2.5 text-right">Valor Faturado</th>
                  <th className="px-3.5 py-2.5 text-right">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSheet.revenues.map((rev) => {
                  const share = activeRevenue > 0 ? (rev.amount / activeRevenue) * 100 : 0;
                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {rev.client}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {rev.project || 'Empreitada Geral'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                        {displayVal(rev.amount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                          {share.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-3.5 py-2.5 text-slate-900">
                    TOTAL DE FATURAMENTO MEDIÇÃO
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-slate-900">
                    {displayVal(activeRevenue)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-slate-900">
                    100.0%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Col: Notas & Regras Societárias */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Diretrizes & Provisões Societárias
            </h4>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Reserva de Fundo de Caixa
              </div>
              <p className="text-[11px] text-slate-500">
                Retenção periódica de <strong>{settings.defaultFundReservePercentage}%</strong> para cobertura de despesas de viaturas, manutenções e contingências de caixa antes da distribuição de lucros.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                Provisão de IRC ({settings.defaultIrcRate}%)
              </div>
              <p className="text-[11px] text-slate-500">
                Provisão tributária calculada sobre a margem operacional para evitar descompassos fiscais no encerramento anual.
              </p>
            </div>

            {activeSheet.consignationReserveNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Nota da Planilha:
                </div>
                <p className="text-[11px] text-amber-800 font-mono">
                  {activeSheet.consignationReserveNote}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
