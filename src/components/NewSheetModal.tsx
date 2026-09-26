import React, { useState } from 'react';
import { Plus, Copy, FileSpreadsheet } from 'lucide-react';
import { CostSheet } from '../types.ts';
import { useAppDialog } from '../context/AppDialogContext.tsx';

const MONTH_NAMES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO'
];

interface NewSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: CostSheet[];
  onCreateSheet: (sheetData: {
    name: string;
    periodType: 'mensal' | 'semestral' | 'trimestral' | 'anual';
    year: number;
    month?: number;
    cloneFromId?: string;
  }) => Promise<void>;
}

export const NewSheetModal: React.FC<NewSheetModalProps> = ({
  isOpen,
  onClose,
  sheets,
  onCreateSheet
}) => {
  const { showAlert } = useAppDialog();
  const [name, setName] = useState('');
  const [periodType, setPeriodType] = useState<'mensal' | 'semestral' | 'trimestral' | 'anual'>('mensal');
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(8);
  const [cloneFromId, setCloneFromId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const existingPeriod = periodType === 'mensal'
      ? sheets.find((sheet) =>
          (sheet.periodType || 'mensal') === 'mensal'
          && Number(sheet.year) === year
          && Number(sheet.month) === month
        )
      : undefined;

    if (existingPeriod) {
      showAlert(
        `${existingPeriod.name || `${MONTH_NAMES[month - 1]} ${year}`} já está cadastrado. `
          + 'Selecione esse período na lista ou escolha outro mês e ano.',
        'Período já existente'
      );
      return;
    }

    setLoading(true);
    try {
      const sheetName = name.trim() || `${MONTH_NAMES[month - 1]} ${year}`;
      await onCreateSheet({
        name: sheetName,
        periodType,
        year,
        month,
        cloneFromId: cloneFromId || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Não foi possível criar o período.';
      showAlert(message, 'Não foi possível criar o período');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Criar Nova Planilha / Período
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-medium">Nome do Período / Mês</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: AGOSTO 2026, SETEMBRO 2026, 2º SEMESTRE 2026..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className={`grid gap-3 ${periodType === 'mensal' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <label className="block text-slate-700 mb-1 font-medium">Tipo de Período</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-medium">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {periodType === 'mensal' && (
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Mês</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTH_NAMES.map((monthName, index) => (
                    <option key={monthName} value={index + 1}>{monthName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-medium flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              Duplicar Estrutura de Planilha Existente (Opcional)
            </label>
            <select
              value={cloneFromId}
              onChange={(e) => setCloneFromId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Começar do modelo padrão em branco --</option>
              {sheets.map((s) => (
                <option key={s.id} value={s.id}>
                  Copiar de: {s.name} ({s.year})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Ao duplicar, todas as categorias, despesas recorrentes e clientes serão copiados para facilitar o preenchimento.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Planilha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
