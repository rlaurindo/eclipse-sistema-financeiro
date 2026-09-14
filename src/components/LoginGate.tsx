import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LoginGate: React.FC = () => {
  const { login, authConfigurationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.error || 'Não foi possível iniciar sessão.');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">GF</div>
          <h1 className="text-xl font-black text-slate-900">Gestão Financeira</h1>
          <p className="mt-1 text-sm text-slate-500">Inicie sessão para aceder ao sistema.</p>
        </div>

        {authConfigurationError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{authConfigurationError}</div>
        )}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            E-mail
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Palavra-passe
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-slate-400" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <button type="submit" disabled={loading || Boolean(authConfigurationError)} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'A autenticar…' : 'Entrar no sistema'}
          </button>
        </form>
      </section>
    </main>
  );
};
