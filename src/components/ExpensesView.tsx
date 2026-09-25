import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Car, 
  Home, 
  Receipt, 
  CreditCard, 
  Wrench, 
  Users, 
  HelpCircle, 
  Check, 
  X, 
  Download,
  Building2,
  Wallet
} from 'lucide-react';
import { CostSheet, CostItem, CategoryDefinition } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useAppDialog } from '../context/AppDialogContext.tsx';

interface ExpensesViewProps {
  activeSheet: CostSheet;
  categories?: CategoryDefinition[];
  onAddCost: (item: Partial<CostItem>) => Promise<void>;
  onUpdateCost: (id: string, item: Partial<CostItem>) => Promise<void>;
  onDeleteCost: (id: string) => Promise<void>;
}

const DEFAULT_CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  carros: { label: 'Carros & Carrinhas', icon: Car, color: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  alojamento: { label: 'Alojamento & Estadia', icon: Home, color: 'text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  impostos: { label: 'Impostos & NISS / IRS', icon: Receipt, color: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' },
  cartao: { label: 'Cartão & Bancos', icon: CreditCard, color: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ferramentas: { label: 'Ferramentas & EPIs', icon: Wrench, color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  salarios: { label: 'Salários & Equipes', icon: Users, color: 'text-cyan-600', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  outros: { label: 'Outras Despesas', icon: HelpCircle, color: 'text-slate-600', badge: 'bg-slate-50 text-slate-700 border-slate-200' }
};

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  activeSheet,
  categories = [],
  onAddCost,
  onUpdateCost,
  onDeleteCost
}) => {
  const { confirmAction } = useAppDialog();
  const { isAdmin, formatCurrency } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('carros');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Conta Corrente');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CostItem>>({});

  // Quick Preset Expenses
  const quickExpenses = [
    { name: 'COMBUSTIVEL', cat: 'carros' },
    { name: 'VIA VERDE', cat: 'carros' },
    { name: 'CARPINTEIROS', cat: 'salarios' },
    { name: 'PEDREIROS', cat: 'salarios' },
    { name: 'ALUGUEL DE ALOJAMENTO', cat: 'alojamento' },
    { name: 'SEGURANÇA SOCIAL / NISS', cat: 'impostos' },
    { name: 'IRS RETENÇÕES', cat: 'impostos' }
  ];

  // Combined Category List
  const allCategories = useMemo(() => {
    const defaultKeys = ['carros', 'alojamento', 'impostos', 'cartao', 'ferramentas', 'salarios', 'outros'];
    const custom = categories.filter((c) => c.type === 'expense').map((c) => c.name.toLowerCase());
    return Array.from(new Set([...defaultKeys, ...custom]));
  }, [categories]);

  const costs = activeSheet?.costs || [];

  const filteredCosts = useMemo(() => {
    return costs.filter((item) => {
      const matchesSearch = searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
      const matchesPayment = paymentFilter === 'all' || item.paymentMethod === paymentFilter;

      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [costs, searchQuery, selectedCategoryFilter, paymentFilter]);

  const totalAmount = useMemo(() => {
    return costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [costs]);

  const handleCreateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    try {
      setIsSubmitting(true);
      await onAddCost({
        name: name.trim().toUpperCase(),
        category,
        amount: parseFloat(amount) || 0,
        date,
        paymentMethod,
        note: note.trim()
      });

      // Reset
      setName('');
      setAmount('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: CostItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm) return;
    await onUpdateCost(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const getCategoryMeta = (catKey: string) => {
    const key = (catKey || 'outros').toLowerCase();
    if (DEFAULT_CATEGORY_LABELS[key]) {
      return DEFAULT_CATEGORY_LABELS[key];
    }
    return {
      label: catKey.toUpperCase(),
      icon: HelpCircle,
      color: 'text-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Gestão de Despesas & Custos
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Período: {activeSheet?.name}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Registro de Despesas Operacionais
          </h2>
          <p className="text-xs text-slate-500">
            Lançamento e controle de salários, combustíveis, viaturas, alojamentos, impostos e outros custos.
          </p>
        </div>

        {/* Counter Widget */}
        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-red-600">Total de Despesas</div>
            <div className="text-base font-black text-red-700">{formatCurrency(totalAmount)}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Lançamentos</div>
            <div className="text-base font-black text-slate-900">{costs.length} itens</div>
          </div>
        </div>
      </div>

      {/* TOP SECTION: FORMULÁRIO DE REGISTRO DE NOVA DESPESA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registrar Nova Despesa
            </h3>
            <p className="text-[11px] text-slate-500">
              Informe a descrição, categoria e valor do custo a ser imputado em {activeSheet?.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateCost} className="space-y-4">
          {/* Row 1: Descrição e Atalhos rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Descrição da Despesa / Fornecedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: COMBUSTIVEL, CARPINTEIROS, VIA VERDE, SEGURO..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Atalhos rápidos:</span>
                {quickExpenses.map((qe) => (
                  <button
                    key={qe.name}
                    type="button"
                    onClick={() => {
                      setName(qe.name);
                      setCategory(qe.cat);
                    }}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-red-50 hover:text-red-800 text-slate-600 rounded-md font-semibold transition cursor-pointer"
                  >
                    {qe.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            <div className="md:col-span-6 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Categoria de Custo <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              >
                {allCategories.map((catKey) => {
                  const meta = getCategoryMeta(catKey);
                  return (
                    <option key={catKey} value={catKey}>
                      {meta.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Row 2: Valor, Data, Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Origem / Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              >
                <option value="Conta Corrente">Conta Corrente (Empresa)</option>
                <option value="Cartão Empresa">Cartão da Empresa</option>
                <option value="Fundo Caixa">Fundo de Caixa</option>
                <option value="Transferência">Transferência Bancária</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Data do Pagamento / Lançamento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Row 3: Observações & Submit */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Observações, nota fiscal, placa da carrinha ou detalhes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !amount}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrar Despesa'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: TABELA COM AS DESPESAS IMPUTADAS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-red-600" />
              Despesas Imputadas no Sistema ({filteredCosts.length} de {costs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Gastos operacionais do mês de {activeSheet?.name}
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar despesa, nota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 w-44 sm:w-52"
              />
            </div>

            {/* Category Dropdown Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Todas as Categorias</option>
              {allCategories.map((catKey) => {
                const meta = getCategoryMeta(catKey);
                return (
                  <option key={catKey} value={catKey}>
                    {meta.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição da Despesa</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta / Pagamento</th>
                <th className="py-3 px-4">Observação / Nota</th>
                <th className="py-3 px-4 text-right">Valor (€)</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <p className="font-semibold">Nenhuma despesa encontrada para os critérios selecionados.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Utilize o formulário acima para lançar novos custos.</p>
                  </td>
                </tr>
              ) : (
                filteredCosts.map((cost) => {
                  const isEditing = editingId === cost.id;
                  const meta = getCategoryMeta(cost.category);
                  const Icon = meta.icon;

                  if (isEditing) {
                    return (
                      <tr key={cost.id} className="bg-red-50/50">
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
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value.toUpperCase() })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={editForm.category || 'outros'}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            {allCategories.map((catKey) => (
                              <option key={catKey} value={catKey}>{getCategoryMeta(catKey).label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            value={editForm.paymentMethod || 'Conta Corrente'}
                            onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            <option value="Conta Corrente">Conta Corrente</option>
                            <option value="Cartão Empresa">Cartão Empresa</option>
                            <option value="Fundo Caixa">Fundo Caixa</option>
                            <option value="Transferência">Transferência</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={editForm.note || ''}
                            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
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
                              onClick={() => handleSaveEdit(cost.id)}
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

                  return (
                    <tr key={cost.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {cost.date || activeSheet?.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {cost.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${meta.badge}`}>
                          <Icon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {cost.paymentMethod || 'Conta Corrente'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {cost.note || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-red-600 text-sm">
                        {formatCurrency(cost.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAdmin && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(cost)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Editar Despesa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (await confirmAction({
                                  title: 'Excluir despesa',
                                  message: `Deseja excluir a despesa "${cost.name}" no valor de ${formatCurrency(cost.amount)}?`,
                                  confirmLabel: 'Excluir despesa'
                                })) {
                                  onDeleteCost(cost.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Excluir Despesa"
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
            {filteredCosts.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-slate-700 text-right uppercase tracking-wider text-xs">
                    Subtotal Filtrado ({filteredCosts.length} despesas):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-red-700 text-sm font-black">
                    {formatCurrency(
                      filteredCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0)
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
