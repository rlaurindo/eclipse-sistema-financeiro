import React, { useState } from 'react';
import { Settings, Users, Plus, Trash2, RotateCcw, Save, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { SystemSettings } from '../types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (updated: SystemSettings) => Promise<void>;
  onResetData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData
}) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handlePartnerChange = (id: string, field: 'name' | 'percentage', value: any) => {
    const updated = formData.partners.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: field === 'percentage' ? (value === '' ? 0 : Number(value)) : value };
      }
      return p;
    });
    setFormData({ ...formData, partners: updated });
  };

  const handleAddPartner = () => {
    const newP = {
      id: `p-${Date.now()}`,
      name: `Sócio ${formData.partners.length + 1}`,
      percentage: 0
    };
    setFormData({ ...formData, partners: [...formData.partners, newP] });
  };

  const handleDeletePartner = (id: string) => {
    setFormData({
      ...formData,
      partners: formData.partners.filter((p) => p.id !== id)
    });
  };

  const handleEqualizePartners = () => {
    const count = formData.partners.length;
    if (count === 0) return;
    const equalShare = Number((100 / count).toFixed(2));
    const updated = formData.partners.map((p) => ({ ...p, percentage: equalShare }));
    setFormData({ ...formData, partners: updated });
  };

  const totalPercentage = formData.partners.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await onUpdateSettings(formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) return;
    try {
      await onResetData();
      setResetConfirm(false);
      onClose();
    } catch (err) {
      alert('Erro ao restaurar base de dados.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Configurações Gerais & Sócios
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-medium">Nome da Empresa / Razão Social</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-medium">Alíquota Padrão IRC (%)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={formData.defaultIrcRate}
                onChange={(e) => setFormData({ ...formData, defaultIrcRate: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-medium">Moeda Padrão</label>
              <input
                type="text"
                disabled
                value="Euro (€) - Portugal"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Partners Configuration */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">Sócios & Divisão de Lucros</span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleEqualizePartners}
                  className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Dividir Igualmente ({formData.partners.length > 0 ? (100 / formData.partners.length).toFixed(1) : 0}%)
                </button>
              )}
            </div>

            <div className="space-y-2">
              {formData.partners.map((partner) => (
                <div key={partner.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={partner.name}
                    onChange={(e) => handlePartnerChange(partner.id, 'name', e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none disabled:opacity-60 disabled:bg-slate-100"
                    placeholder="Nome do Sócio"
                  />
                  <div className="relative w-24">
                    <input
                      type="number"
                      disabled={!isAdmin}
                      step="0.1"
                      value={partner.percentage ?? ''}
                      onChange={(e) => handlePartnerChange(partner.id, 'percentage', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-right text-emerald-700 font-bold outline-none pr-5 disabled:opacity-60 disabled:bg-slate-100"
                    />
                    <span className="absolute right-2 top-1.5 text-slate-400">%</span>
                  </div>

                  {isAdmin && formData.partners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeletePartner(partner.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleAddPartner}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Sócio
                </button>
              )}
              <span className={`font-bold ml-auto ${totalPercentage === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                Total: {totalPercentage.toFixed(1)}% {totalPercentage !== 100 && '(Atenção: soma diferente de 100%)'}
              </span>
            </div>
          </div>

          {/* Reset Database Section for Admin */}
          {isAdmin && (
            <div className="border border-rose-200 bg-rose-50/60 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>Restaurar Planilhas Originais</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Restaura todas as planilhas para o estado padrão original (Setembro 2024, Janeiro 2025, Julho 2026 e Matriz de Obras).
              </p>

              {resetConfirm ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    Confirmar Restauração
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-rose-700 rounded-lg text-[11px] font-semibold cursor-pointer shadow-xs"
                >
                  Restaurar Padrão de Fábrica
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
            {isAdmin && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
