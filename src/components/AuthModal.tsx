import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  LogIn, 
  Users, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user: currentUser, 
    login, 
    register, 
    authMode, 
    setAuthMode, 
    usersList, 
    isAdmin 
  } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    setEmail(demoEmail);
    setPassword(demoPass);
    const res = await login(demoEmail, demoPass);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Login efetuado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.error || 'Erro ao efetuar login.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    if (authMode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Autenticação realizada com sucesso!');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Falha ao autenticar. Verifique email e senha.');
      }
    } else {
      if (!name) {
        setErrorMsg('Por favor, informe seu nome completo.');
        setLoading(false);
        return;
      }
      const res = await register(name, email, password, role);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(`Usuário registrado com sucesso como ${role === 'admin' ? 'Administrador' : 'Usuário (Leitura)'}!`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Erro ao cadastrar usuário.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Autenticação & Controle de Acesso
              </h3>
              <p className="text-xs text-slate-500">
                Acesso baseado em perfis: <strong>Admin</strong> (Escrita) e <strong>User</strong> (Leitura)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Active Session Chip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
              {currentUser.name.substring(0, 2)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {currentUser.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {currentUser.role === 'admin' ? '🛡️ Administrador (Total)' : '👁️ Usuário (Somente Leitura)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{currentUser.email}</div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Conectado
          </span>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Criar Conta (Registro)
          </button>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Acesso Rápido de Teste (1-Clique):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@obras.pt', 'admin')}
              disabled={loading}
              className="p-2 text-left rounded-lg bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200 text-xs transition cursor-pointer"
            >
              <div className="font-bold text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Admin Demo
              </div>
              <div className="text-[10px] text-amber-700 font-mono truncate">admin@obras.pt</div>
              <div className="text-[9px] text-amber-600 mt-0.5">Leitura + Escrita Total</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('user@obras.pt', 'user123')}
              disabled={loading}
              className="p-2 text-left rounded-lg bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200 text-xs transition cursor-pointer"
            >
              <div className="font-bold text-blue-900 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-600" /> User Demo
              </div>
              <div className="text-[10px] text-blue-700 font-mono truncate">user@obras.pt</div>
              <div className="text-[9px] text-blue-600 mt-0.5">Apenas Leitura</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('socio@obras.pt', 'user123')}
              disabled={loading}
              className="p-2 text-left rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs transition cursor-pointer"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-600" /> Sócio Demo
              </div>
              <div className="text-[10px] text-slate-600 font-mono truncate">socio@obras.pt</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Consulta de Lucros</div>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {authMode === 'register' && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Engenheiro Carlos Silva"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.pt"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">
                Senha de Acesso
              </label>
              {authMode === 'login' && (
                <span className="text-[10px] text-slate-400">
                  Padrão demo: admin ou user123
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Selection on Register */}
          {authMode === 'register' && (
            <div className="space-y-2 pt-1">
              <label className="block text-slate-700 font-semibold">
                Nível de Permissão (Role)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  onClick={() => setRole('user')}
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    role === 'user'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      'user' (Leitura)
                    </div>
                    {role === 'user' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Visualiza custos, faturamento de obras e relatórios. Sem permissão de edição.
                  </p>
                </label>

                <label
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    role === 'admin'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      'admin' (Total)
                    </div>
                    {role === 'admin' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Leitura e escrita total. Edita custos, cria planilhas e gerencia sócios.
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Processando...</span>
              ) : authMode === 'login' ? (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Concluir Cadastro</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Registered Users List (Visible for transparency & testing) */}
        {usersList && usersList.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" /> Usuários Cadastrados ({usersList.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto divide-y divide-slate-100">
              {usersList.map((u) => (
                <div key={u.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{u.name}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-mono">({u.email})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    u.role === 'admin'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
