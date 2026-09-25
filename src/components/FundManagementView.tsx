import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Receipt, 
  AlertCircle, 
  FileSpreadsheet, 
  CheckCircle2, 
  DollarSign,
  TrendingDown,
  Building,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { CostSheet, FundExpenseItem } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { useAppDialog } from '../context/AppDialogContext.tsx';

interface FundManagementViewProps {
  sheet: CostSheet;
  onUpdateSheet: (updated: CostSheet) => Promise<void>;
}

export const FundManagementView: React.FC<FundManagementViewProps> = ({
  sheet,
  onUpdateSheet
}) => {
  const { isAdmin } = useAuth();
  const { showAlert } = useAppDialog();
  const [currentSheet, setCurrentSheet] = useState<CostSheet>(sheet);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setCurrentSheet(sheet);
  }, [sheet]);

  const totalFundExpenses = currentSheet.fundExpenses.reduce((s, fe) => s + (Number(fe.amount) || 0), 0);
  
  const rec = currentSheet.reconciliation || {
    accountBalance: 0,
    advances: 0,
    housingCosts: 0,
    fuelCosts: 0,
    otherDiffs: 0,
    calculatedDifference: 0,
    notes: ''
  };

  const calculatedDifference = (Number(rec.accountBalance) || 0) - (
    (Number(rec.advances) || 0) + (Number(rec.housingCosts) || 0) + (Number(rec.fuelCosts) || 0) + (Number(rec.otherDiffs) || 0)
  );

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await onUpdateSheet({
        ...currentSheet,
        reconciliation: {
          ...rec,
          calculatedDifference
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao salvar dados do fundo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFundItemChange = (id: string, field: keyof FundExpenseItem, value: any) => {
    if (!isAdmin) return;
    const updated = currentSheet.fundExpenses.map((fe) => {
      if (fe.id === id) {
        return { ...fe, [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value };
      }
      return fe;
    });
    setCurrentSheet({ ...currentSheet, fundExpenses: updated });
  };

  const handleAddFundItem = () => {
    if (!isAdmin) return;
    const newItem: FundExpenseItem = {
      id: `fe-${Date.now()}`,
      name: 'NOVO GASTO EXTRAORDINÁRIO DO FUNDO',
      amount: 0,
      notes: ''
    };
    setCurrentSheet({ ...currentSheet, fundExpenses: [...currentSheet.fundExpenses, newItem] });
  };

  const handleDeleteFundItem = (id: string) => {
    if (!isAdmin) return;
    setCurrentSheet({
      ...currentSheet,
      fundExpenses: currentSheet.fundExpenses.filter((fe) => fe.id !== id)
    });
  };

  const handleRecChange = (field: string, value: any) => {
    if (!isAdmin) return;
    const numVal = field === 'notes' ? value : (value === '' ? 0 : Number(value));
    setCurrentSheet({
      ...currentSheet,
      reconciliation: {
        ...rec,
        [field]: numVal
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
              {currentSheet.name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Gestão do Fundo de Caixa & Conciliação Bancária
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Controle de retiradas extraordinárias, provisões consignadas de impostos e apuração de saldos em conta.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
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
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Gastos do Fundo */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Total Gastos do Fundo
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {formatCurrency(totalFundExpenses)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {currentSheet.fundExpenses.length} lançamentos extraordinários
          </div>
        </div>

        {/* Saldo da Empresa / Fundo */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-600" />
            Saldo em Conta Empresa / Fundo
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700 font-mono">
            {formatCurrency(currentSheet.companyAccountFundBalance)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Disponível em reserva líquida
          </div>
        </div>

        {/* Fundo Consignado para Impostos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-700" />
            Fundo de Reserva Consignado
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {formatCurrency(currentSheet.fundValueReserve)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Provisionamento para impostos / IRC
          </div>
        </div>
      </div>

      {/* Grid: Gastos do Fundo vs Conciliação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tabela Gastos do Fundo (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-400 font-bold" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                GASTOS DO FUNDO - LANÇAMENTOS DETALHADOS
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded">
              TOTAL: {formatCurrency(totalFundExpenses)}
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="divide-y divide-slate-100">
              {currentSheet.fundExpenses.map((fe) => (
                <div key={fe.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 space-y-1">
                    {isAdmin ? (
                      <>
                        <input
                          type="text"
                          value={fe.name}
                          onChange={(e) => handleFundItemChange(fe.id, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Descrição do gasto do fundo"
                        />
                        <input
                          type="text"
                          value={fe.notes || ''}
                          onChange={(e) => handleFundItemChange(fe.id, 'notes', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Observação (ex: Gasto tirar do fundo 1979...)"
                        />
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-slate-800">{fe.name}</div>
                        {fe.notes && <div className="text-[11px] text-slate-500 italic">{fe.notes}</div>}
                      </>
                    )}
                  </div>

                  <div className="w-32 text-right font-mono">
                    {isAdmin ? (
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={fe.amount ?? ''}
                          onChange={(e) => handleFundItemChange(fe.id, 'amount', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500 pr-5"
                        />
                        <span className="absolute right-1.5 top-1 text-slate-400">€</span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(fe.amount)}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteFundItem(fe.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <button
                onClick={handleAddFundItem}
                className="w-full mt-2 py-2 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Lançamento no Fundo
              </button>
            )}
          </div>
        </div>

        {/* Right: Conciliação Bancária (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                CONCILIAÇÃO BANCÁRIA APURADA
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 font-bold">VALOR NA CONTA:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={rec.accountBalance ?? ''}
                      onChange={(e) => handleRecChange('accountBalance', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(rec.accountBalance)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">VALES FEITOS:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={rec.advances ?? ''}
                      onChange={(e) => handleRecChange('advances', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-700">{formatCurrency(rec.advances)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">CUSTOS DO ALOJAMENTO:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={rec.housingCosts ?? ''}
                      onChange={(e) => handleRecChange('housingCosts', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-700">{formatCurrency(rec.housingCosts)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">COMBUSTÍVEL:</span>
                <div className="w-36 text-right font-mono">
                  {isAdmin ? (
                    <input
                      type="number"
                      value={rec.fuelCosts ?? ''}
                      onChange={(e) => handleRecChange('fuelCosts', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-700">{formatCurrency(rec.fuelCosts)}</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase">DIFERENÇA EM CONTA:</span>
                <span className="font-mono text-base font-bold text-blue-700">
                  {formatCurrency(calculatedDifference)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Notas Explicativas:</label>
                {isAdmin ? (
                  <textarea
                    rows={3}
                    value={rec.notes || ''}
                    onChange={(e) => handleRecChange('notes', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas de auditoria..."
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                    {rec.notes || 'Sem observações registradas.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
