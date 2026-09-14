import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Edit3, 
  Check, 
  Filter,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { InvoicingCycle } from '../types.ts';
import { formatCurrency, exportInvoicingToExcel } from '../utils/formatters.ts';

interface InvoicingObrasViewProps {
  invoicingMatrix: InvoicingCycle[];
  onAddInvoicingItem: (item: Partial<InvoicingCycle>) => Promise<void>;
  onUpdateInvoicingItem: (id: string, updated: Partial<InvoicingCycle>) => Promise<void>;
  onDeleteInvoicingItem: (id: string) => Promise<void>;
}

export const InvoicingObrasView: React.FC<InvoicingObrasViewProps> = ({
  invoicingMatrix,
  onAddInvoicingItem,
  onUpdateInvoicingItem,
  onDeleteInvoicingItem
}) => {
  const { isAdmin } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvoicingCycle>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');

  const [newItem, setNewItem] = useState<{
    cycleName: string;
    month: string;
    company: string;
    project: string;
    amount: number;
  }>({
    cycleName: 'FATURA MAIO/JUNHO',
    month: 'JUNHO',
    company: 'EMPRESA ESPANO',
    project: 'CUBIC II - GABRIEL COUTINHO',
    amount: 0
  });

  // Calculate unique companies, projects, cycles
  const companies = useMemo(() => {
    const set = new Set<string>(invoicingMatrix.map((i) => i.company));
    return Array.from(set);
  }, [invoicingMatrix]);

  const projects = useMemo(() => {
    const set = new Set<string>(invoicingMatrix.map((i) => i.project));
    return Array.from(set);
  }, [invoicingMatrix]);

  const cycles = useMemo(() => {
    const order = [
      'FATURA JANEIRO/FEVEREIRO',
      'FATURA FEVEREIRO/MARÇO',
      'FATURA MARÇO/ABRIL',
      'FATURA ABRIL/MAIO',
      'FATURA MAIO/JUNHO',
      'FATURA JUNHO/JULHO'
    ];
    const present = Array.from(new Set<string>(invoicingMatrix.map((i) => i.cycleName)));
    // Sort according to known sequence
    return present.sort((a: string, b: string) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [invoicingMatrix]);

  // Calculations per company
  const companyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    invoicingMatrix.forEach((i) => {
      totals[i.company] = (totals[i.company] || 0) + (Number(i.amount) || 0);
    });
    return totals;
  }, [invoicingMatrix]);

  // Calculations per project
  const projectTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    invoicingMatrix.forEach((i) => {
      totals[i.project] = (totals[i.project] || 0) + (Number(i.amount) || 0);
    });
    return totals;
  }, [invoicingMatrix]);

  const totalSemestral = useMemo(() => {
    return invoicingMatrix.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [invoicingMatrix]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (selectedCompanyFilter === 'ALL') return invoicingMatrix;
    return invoicingMatrix.filter((i) => i.company === selectedCompanyFilter);
  }, [invoicingMatrix, selectedCompanyFilter]);

  const handleStartEdit = (item: InvoicingCycle) => {
    if (!isAdmin) return;
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !isAdmin) return;
    await onUpdateInvoicingItem(editingId, editForm);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!isAdmin) return;
    await onAddInvoicingItem(newItem);
    setShowAddModal(false);
    setNewItem({
      cycleName: 'FATURA MAIO/JUNHO',
      month: 'JUNHO',
      company: 'EMPRESA ESPANO',
      project: 'CUBIC II - GABRIEL COUTINHO',
      amount: 0
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase tracking-wider">
              MATRIZ DE MEDIÇÕES & OBRAS 2026
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Faturamento por Obras & Empresas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Acompanhamento de medições quinzenais/mensais, faturamento por empreiteira e consolidação semestral.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportInvoicingToExcel(invoicingMatrix)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Matriz Excel</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Faturação de Obra</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards by Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Semestral */}
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Total Faturado Semestral
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">
            {formatCurrency(totalSemestral)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Consolidado de todas as obras
          </div>
        </div>

        {/* ESPANO */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            EMPRESA ESPANO (TOTAL)
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {formatCurrency(companyTotals['EMPRESA ESPANO'] || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Cubic II, Barcelona, Outeiro
          </div>
        </div>

        {/* CNT */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            EMPRESA CNT (TOTAL)
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
            {formatCurrency(companyTotals['EMPRESA CNT'] || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Quadra - Vila Nova de Gaia
          </div>
        </div>

        {/* Média Mensal */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Faturamento Mensal Julho
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700 font-mono">
            60.632,00 €
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Abril (58k) • Maio (69k) • Junho (64k)
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              MATRIZ DE FATURAMENTO POR CICLO & OBRA (MÊS ANO 2026)
            </h3>
          </div>

          {/* Company Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg text-xs shadow-2xs">
            <button
              onClick={() => setSelectedCompanyFilter('ALL')}
              className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                selectedCompanyFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            {companies.map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedCompanyFilter(comp)}
                className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                  selectedCompanyFilter === comp ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Ciclo de Faturação</th>
                <th className="py-3 px-4">CUBIC II - GABRIEL C.</th>
                <th className="py-3 px-4">BARCELONA</th>
                <th className="py-3 px-4">OUTEIRO</th>
                <th className="py-3 px-4">QUADRA - V. N. GAIA</th>
                <th className="py-3 px-4 text-right">TOTAL CICLO (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {cycles.map((cycle) => {
                const cubic = invoicingMatrix.find((i) => i.cycleName === cycle && i.project.includes('CUBIC II'))?.amount || 0;
                const barc = invoicingMatrix.find((i) => i.cycleName === cycle && i.project.includes('BARCELONA'))?.amount || 0;
                const outeiro = invoicingMatrix.find((i) => i.cycleName === cycle && i.project.includes('OUTEIRO'))?.amount || 0;
                const quadra = invoicingMatrix.find((i) => i.cycleName === cycle && i.project.includes('QUADRA'))?.amount || 0;
                const rowTotal = cubic + barc + outeiro + quadra;

                return (
                  <tr key={cycle} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      {cycle}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {cubic > 0 ? formatCurrency(cubic) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {barc > 0 ? formatCurrency(barc) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {outeiro > 0 ? formatCurrency(outeiro) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {quadra > 0 ? formatCurrency(quadra) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-xs border-t-2 border-slate-200">
                <td className="py-3.5 px-4 font-sans uppercase text-slate-900">TOTAL POR OBRA</td>
                <td className="py-3.5 px-4 font-mono text-slate-900">
                  {formatCurrency(projectTotals['CUBIC II - GABRIEL COUTINHO'] || 0)}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-900">
                  {formatCurrency(projectTotals['BARCELONA'] || 0)}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-900">
                  {formatCurrency(projectTotals['OUTEIRO'] || 0)}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-900">
                  {formatCurrency(projectTotals['QUADRA - VILA NOVA DE GAIA'] || 0)}
                </td>
                <td className="py-3.5 px-4 font-mono text-right text-emerald-600 text-sm font-bold">
                  {formatCurrency(totalSemestral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Granular Table of All Invoicing Items */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              REGISTROS DETALHADOS DE FATURAMENTO ({filteredEntries.length} itens)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {isAdmin ? 'Clique em Editar para ajustar valores' : 'Modo Somente Leitura'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEntries.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                    <input
                      type="text"
                      value={editForm.company || ''}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Empresa"
                    />
                    <input
                      type="text"
                      value={editForm.project || ''}
                      onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Obra"
                    />
                    <input
                      type="text"
                      value={editForm.cycleName || ''}
                      onChange={(e) => setEditForm({ ...editForm, cycleName: e.target.value })}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ciclo"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editForm.amount ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-right text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Valor"
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shadow-2xs"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold">
                          {item.company}
                        </span>
                        <span>{item.project}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.cycleName} • Mês: <span className="text-slate-700 font-medium">{item.month}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                            title="Editar registro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteInvoicingItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Invoicing Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Lançar Faturamento de Obra
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Empresa / Empreiteira</label>
                <input
                  type="text"
                  value={newItem.company}
                  onChange={(e) => setNewItem({ ...newItem, company: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: EMPRESA ESPANO, EMPRESA CNT..."
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Obra / Local</label>
                <input
                  type="text"
                  value={newItem.project}
                  onChange={(e) => setNewItem({ ...newItem, project: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: CUBIC II - GABRIEL COUTINHO, QUADRA - VILA NOVA DE GAIA..."
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Ciclo de Faturação</label>
                <input
                  type="text"
                  value={newItem.cycleName}
                  onChange={(e) => setNewItem({ ...newItem, cycleName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: FATURA MAIO/JUNHO"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Mês de Referência</label>
                  <input
                    type="text"
                    value={newItem.month}
                    onChange={(e) => setNewItem({ ...newItem, month: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: JUNHO"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Valor Faturado (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.amount || ''}
                    onChange={(e) => setNewItem({ ...newItem, amount: Number(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Confirmar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
