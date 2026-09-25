import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, LogOut, Mail, ShieldCheck, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { getRoleLabel, isDeveloperAccount } from '../utils/userLabels.ts';

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, updatePassword, logout } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setChangingPassword(false); setNewPassword(''); setPasswordConfirmation('');
      setShowPassword(false); setError(''); setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (newPassword.length < 6) { setError('A nova palavra-passe deve ter pelo menos 6 caracteres.'); return; }
    if (newPassword !== passwordConfirmation) { setError('As palavras-passe não coincidem.'); return; }
    setLoading(true);
    const result = await updatePassword(newPassword, { signOut: false });
    setLoading(false);
    if (!result.success) { setError(result.error || 'Não foi possível alterar a palavra-passe.'); return; }
    setNewPassword(''); setPasswordConfirmation(''); setChangingPassword(false);
    setSuccess('Palavra-passe alterada com sucesso.');
  };

  const handleLogout = () => { onClose(); logout(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onClose();
    }}>
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><User className="h-5 w-5" /></div>
            <div><h2 id="account-title" className="text-base font-black text-slate-900">Minha conta</h2><p className="text-xs text-slate-500">Informações e segurança do utilizador</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black uppercase text-white">{user.name.substring(0, 2)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><p className="truncate text-sm font-black text-slate-900">{user.name}</p><span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ativo</span></div>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500"><Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Perfil</p><p className="mt-1 flex items-center gap-1.5 text-xs font-black text-slate-800"><ShieldCheck className={`h-4 w-4 ${isDeveloperAccount(user.email) ? 'text-violet-600' : isAdmin ? 'text-blue-600' : 'text-slate-500'}`} />{getRoleLabel(user.email, user.role, true)}</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Permissões</p><p className="mt-1 text-xs font-black text-slate-800">{isAdmin ? 'Leitura e edição' : 'Somente leitura'}</p></div>
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
          {success && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4" />{success}</div>}

          {changingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><KeyRound className="h-4 w-4 text-blue-600" /> Alterar palavra-passe</h3><p className="mt-1 text-[11px] text-slate-500">Utilize pelo menos 6 caracteres.</p></div>
              <label className="block text-xs font-bold text-slate-700">Nova palavra-passe<div className="relative mt-1.5"><input autoFocus type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-slate-400" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
              <label className="block text-xs font-bold text-slate-700">Confirmar nova palavra-passe<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <div className="flex justify-end gap-2 pt-1"><button type="button" disabled={loading} onClick={() => { setChangingPassword(false); setError(''); setNewPassword(''); setPasswordConfirmation(''); }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Cancelar</button><button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'A guardar…' : 'Guardar palavra-passe'}</button></div>
            </form>
          ) : (
            <button type="button" onClick={() => { setChangingPassword(true); setSuccess(''); setError(''); }} className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100"><span className="flex items-center gap-2 text-xs font-black text-blue-800"><KeyRound className="h-4 w-4" /> Alterar palavra-passe</span><span className="text-xs text-blue-600">Abrir →</span></button>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" onClick={handleLogout} disabled={loading} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><LogOut className="h-4 w-4" /> Terminar sessão</button>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">Fechar</button>
        </footer>
      </section>
    </div>
  );
};
