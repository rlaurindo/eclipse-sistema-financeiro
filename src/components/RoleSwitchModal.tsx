import React, { useState } from 'react';
import { ShieldCheck, Eye, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, switchRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'viewer'>(user.role);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    setErrorMsg(null);
    if (selectedRole === 'admin') {
      const success = switchRole('admin', pin);
      if (!success) {
        setErrorMsg('Senha ou PIN de Administrador incorreto. (Dica: Use 1234 ou admin)');
        return;
      }
    } else {
      switchRole('viewer');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Controle de Acesso ao Sistema (RBAC)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Selecione o perfil de usuário para operar no sistema. Usuários comuns têm acesso de visualização, enquanto administradores possuem permissão total de edição.
        </p>

        {/* Role options */}
        <div className="space-y-3">
          {/* Admin Card */}
          <div
            onClick={() => setSelectedRole('admin')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-blue-50/60 border-blue-600 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    Administrador
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                      Edição Total
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Pode editar todos os custos, faturamentos, sócios, fundos e criar planilhas.
                  </div>
                </div>
              </div>
              {selectedRole === 'admin' && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
            </div>

            {selectedRole === 'admin' && !isAdmin && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <label className="block text-[11px] text-slate-700 font-medium mb-1">
                  Senha / PIN de Acesso (Padrão: 1234 ou deixe em branco):
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite 1234..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Viewer Card */}
          <div
            onClick={() => setSelectedRole('viewer')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              selectedRole === 'viewer'
                ? 'bg-slate-50 border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    Visualizador (Outros Usuários)
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                      Somente Leitura
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Apenas consulta planilhas, faturamentos, gráficos e relatórios. Sem permissão de edição.
                  </div>
                </div>
              </div>
              {selectedRole === 'viewer' && <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
          >
            Aplicar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};
