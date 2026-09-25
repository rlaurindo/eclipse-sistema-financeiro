import React, { useState, useMemo } from 'react';
import { 
  ArrowDownLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Calendar, 
  Check, 
  X, 
  Download, 
  Zap,
  DollarSign
} from 'lucide-react';
import { CostSheet, RevenueItem, CategoryDefinition } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useAppDialog } from '../context/AppDialogContext.tsx';

interface EntriesViewProps {
  activeSheet: CostSheet;
  categories?: CategoryDefinition[];
  onAddRevenue: (item: Partial<RevenueItem>) => Promise<void>;
  onUpdateRevenue: (id: string, item: Partial<RevenueItem>) => Promise<void>;
  onDeleteRevenue: (id: string) => Promise<void>;
}

export const EntriesView: React.FC<EntriesViewProps> = ({
  activeSheet,
  categories = [],
  onAddRevenue,
  onUpdateRevenue,
  onDeleteRevenue
}) => {
  const { confirmAction } = useAppDialog();
  const { isAdmin, formatCurrency } = useAuth();

  // Form State for new Entry
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [category, setCategory] = useState('Empreitada');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'pago' | 'pendente' | 'previsto'>('pago');
  const [paymentMethod, setPaymentMethod] = useState('Transferência');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RevenueItem>>({});

  // Quick Preset Clients
  const quickClients = ['EMPRESA ESPANO', 'EMPRESA CNT', 'CIP', 'NOVAGENTE', 'OUTROS'];

  // Categories available for entries
  const entryCategories = useMemo(() => {
    const custom = categories.filter((c) => c.type === 'entry').map((c) => c.name);
    const defaults = ['Empreitada', 'Medição Mensal', 'Adiantamento', 'Serviços Extras', 'Outros'];
    return Array.from(new Set([...defaults, ...custom]));
  }, [categories]);

  // Revenues list & calculations
  const revenues = activeSheet?.revenues || [];

  const filteredRevenues = useMemo(() => {
    return revenues.filter((item) => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.project && item.project.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'pago' && (item.status === 'pago' || !item.status)) ||
        (statusFilter === 'pendente' && (item.status === 'pendente' || item.status === 'previsto'));

      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [revenues, searchQuery, statusFilter, categoryFilter]);

  const totalAmount = useMemo(() => {
    return revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [revenues]);

  const totalPaid = useMemo(() => {
    return revenues
      .filter((r) => r.status === 'pago' || !r.status)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [revenues]);

  const totalPending = useMemo(() => {
    return revenues
      .filter((r) => r.status === 'pendente' || r.status === 'previsto')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [revenues]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !amount) return;

    try {
      setIsSubmitting(true);
      await onAddRevenue({
        client: client.trim(),
        project: project.trim(),
        category,
        amount: parseFloat(amount) || 0,
        date,
        status,
        paymentMethod,
        notes: notes.trim()
      });

      // Reset form
      setClient('');
      setProject('');
      setAmount('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: RevenueItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm) return;
    await onUpdateRevenue(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleToggleStatus = async (item: RevenueItem) => {
    if (!isAdmin) return;
    const nextStatus = item.status === 'pago' ? 'pendente' : 'pago';
    await onUpdateRevenue(item.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Gestão de Entradas & Faturamento
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Período: {activeSheet?.name}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Registro de Entradas e Faturamento
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre novos faturamentos, medições e consulte a listagem detalhada dos valores imputados.
          </p>
        </div>

        {/* Total Summary Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Faturado</div>
            <div className="text-base font-black text-slate-900">{formatCurrency(totalAmount)}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-600">Recebido</div>
            <div className="text-base font-black text-emerald-700">{formatCurrency(totalPaid)}</div>
          </div>
          {totalPending > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-right">
              <div className="text-[10px] uppercase font-bold text-amber-600">Pendente</div>
              <div className="text-base font-black text-amber-700">{formatCurrency(totalPending)}</div>
            </div>
          )}
        </div>
      </div>

      {/* TOP SECTION: FORMULÁRIO DE REGISTRO DE NOVA ENTRADA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registrar Nova Entrada
            </h3>
            <p className="text-[11px] text-slate-500">
              Preencha os dados abaixo para imputar um novo faturamento no mês de {activeSheet?.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateEntry} className="space-y-4">
          {/* Row 1: Cliente/Obra & Presets */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Cliente / Empresa / Origem <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: EMPRESA ESPANO, EMPRESA CNT, CIP..."
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Atalhos:</span>
                {quickClients.map((qc) => (
                  <button
                    key={qc}
                    type="button"
                    onClick={() => setClient(qc)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md font-semibold transition cursor-pointer"
                  >
                    {qc}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-6 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Obra / Projeto / Descrição
              </label>
              <input
                type="text"
                placeholder="Ex: QUADRA - VILA NOVA DE GAIA, CUBIC II..."
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: Categoria, Valor, Data, Status, Forma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Categoria de Entrada
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {entryCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Valor (€) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Status do Recebimento
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pago">Recebido (Em Conta)</option>
                <option value="pendente">Pendente de Pagamento</option>
                <option value="previsto">Previsto</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Data do Registro
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Observações e Botão de Salvar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Observações adicionais (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="submit"
              disabled={isSubmitting || !client.trim() || !amount}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrar Entrada'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: TABELA COM OS VALORES IMPUTADOS NO SISTEMA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Header & Search Filter Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Entradas Imputadas no Sistema ({filteredRevenues.length} de {revenues.length})
            </h3>
            <p className="text-xs text-slate-500">
              Registros financeiros computados para {activeSheet?.name}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente, obra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('pago')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  statusFilter === 'pago' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Recebidos
              </button>
              <button
                onClick={() => setStatusFilter('pendente')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  statusFilter === 'pendente' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pendentes
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Data / Mês</th>
                <th className="py-3 px-4">Cliente / Empresa</th>
                <th className="py-3 px-4">Obra / Projeto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Valor (€)</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRevenues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <p className="font-semibold">Nenhuma entrada encontrada para os filtros selecionados.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Utilize o formulário acima para registrar novos valores.</p>
                  </td>
                </tr>
              ) : (
                filteredRevenues.map((rev) => {
                  const isEditing = editingId === rev.id;

                  if (isEditing) {
                    return (
                      <tr key={rev.id} className="bg-emerald-50/50">
                        <td className="py-2.5 px-4">
                          <input
                            type="date"
                            value={editForm.date || ''}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={editForm.client || ''}
                            onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={editForm.project || ''}
                            onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={editForm.category || 'Empreitada'}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            {entryCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <select
                            value={editForm.status || 'pago'}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            <option value="pago">Pago</option>
                            <option value="pendente">Pendente</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount || ''}
                            onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-right font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(rev.id)}
                              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded transition cursor-pointer"
                              title="Salvar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const isPaid = rev.status === 'pago' || !rev.status;

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {rev.date || activeSheet?.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {rev.client}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rev.project || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                          {rev.category || 'Empreitada'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(rev)}
                          disabled={!isAdmin}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Clique para alternar o status"
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{isPaid ? 'RECEBIDO' : 'PENDENTE'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(rev.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAdmin && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(rev)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Editar Entrada"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (await confirmAction({
                                  title: 'Excluir entrada',
                                  message: `Deseja excluir a entrada "${rev.client}" no valor de ${formatCurrency(rev.amount)}?`,
                                  confirmLabel: 'Excluir entrada'
                                })) {
                                  onDeleteRevenue(rev.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Excluir Entrada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Summary Total */}
            {filteredRevenues.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-slate-700 text-right uppercase tracking-wider text-xs">
                    Subtotal Filtrado ({filteredRevenues.length} itens):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800 text-sm font-black">
                    {formatCurrency(
                      filteredRevenues.reduce((s, r) => s + (Number(r.amount) || 0), 0)
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
