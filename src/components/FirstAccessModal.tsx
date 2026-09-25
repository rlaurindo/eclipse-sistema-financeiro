import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const FirstAccessModal: React.FC = () => {
  const { user, completeFirstAccess } = useAuth();
  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user.firstAccessPending) return null;

  const finish = async (newPassword?: string) => {
    setLoading(true); setError('');
    const result = await completeFirstAccess(newPassword);
    setLoading(false);
    if (!result.success) setError(result.error || 'Não foi possível concluir o primeiro acesso.');
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { setError('A nova palavra-passe deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirmation) { setError('As palavras-passe não coincidem.'); return; }
    await finish(password);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="first-access-title">
        <header className="border-b border-blue-100 bg-blue-50 px-6 py-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700"><ShieldCheck className="h-6 w-6" /></div>
          <h2 id="first-access-title" className="mt-3 text-lg font-black text-slate-900">Bem-vindo, {user.name}</h2>
          <p className="mt-1 text-sm text-slate-600">Este é o seu primeiro acesso ao sistema.</p>
        </header>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            A palavra-passe atual foi definida pelo administrador. Por segurança, pode alterá-la agora ou optar por mantê-la.
          </div>
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

          {changePassword ? (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Nova palavra-passe
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input autoFocus type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-slate-400" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </label>
              <label className="block text-xs font-bold text-slate-700">Confirmar nova palavra-passe
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" disabled={loading} onClick={() => { setChangePassword(false); setPassword(''); setConfirmation(''); setError(''); }} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Voltar</button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'A guardar…' : 'Alterar e continuar'}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              <button type="button" onClick={() => setChangePassword(true)} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Alterar palavra-passe</button>
              <button type="button" disabled={loading} onClick={() => void finish()} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{loading ? 'A confirmar…' : 'Manter a palavra-passe atual'}</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
