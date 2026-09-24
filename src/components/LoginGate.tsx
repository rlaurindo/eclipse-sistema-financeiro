import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LoginGate: React.FC = () => {
  const { login, requestPasswordReset, updatePassword, isPasswordRecovery, authConfigurationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordLinkMode, setPasswordLinkMode] = useState<'first-access' | 'recovery' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const recoveryError = params.get('error_description');
    if (recoveryError) {
      setError(recoveryError.replace(/\+/g, ' '));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.error || 'Não foi possível iniciar sessão.');
    setLoading(false);
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 8) return setError('A palavra-passe deve ter pelo menos 8 caracteres.');
    if (password !== passwordConfirmation) return setError('As palavras-passe não coincidem.');
    setLoading(true);
    const result = await updatePassword(password);
    if (result.success) setSuccess('Palavra-passe alterada. Inicie sessão com a nova palavra-passe.');
    else setError(result.error || 'Não foi possível alterar a palavra-passe.');
    setLoading(false);
    setPassword('');
    setPasswordConfirmation('');
  };

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const result = await requestPasswordReset(email);
    if (result.success) {
      setSuccess(passwordLinkMode === 'first-access'
        ? 'Se o e-mail estiver registado, receberá um link para criar a sua palavra-passe.'
        : 'Se o e-mail estiver registado, receberá um novo link de recuperação.');
    }
    else setError(result.error || 'Não foi possível enviar o link de recuperação.');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">GF</div>
          <h1 className="text-xl font-black text-slate-900">Gestão Financeira</h1>
          <p className="mt-1 text-sm text-slate-500">{isPasswordRecovery
            ? 'Defina uma nova palavra-passe para a sua conta.'
            : passwordLinkMode === 'first-access'
              ? 'Use o e-mail cadastrado para criar a sua palavra-passe.'
              : passwordLinkMode === 'recovery'
                ? 'Receba um novo link de recuperação por e-mail.'
                : 'Inicie sessão para aceder ao sistema.'}</p>
        </div>

        {authConfigurationError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{authConfigurationError}</div>
        )}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{success}</div>}

        <form onSubmit={isPasswordRecovery ? handlePasswordUpdate : passwordLinkMode ? handleResetRequest : handleSubmit} className="space-y-4">
          {!isPasswordRecovery && (
          <label className="block text-xs font-bold text-slate-700">
            E-mail
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </label>
          )}
          {!passwordLinkMode && <label className="block text-xs font-bold text-slate-700">
            {isPasswordRecovery ? 'Nova palavra-passe' : 'Palavra-passe'}
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} autoComplete={isPasswordRecovery ? 'new-password' : 'current-password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-slate-400" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>}
          {isPasswordRecovery && (
            <label className="block text-xs font-bold text-slate-700">
              Confirmar nova palavra-passe
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </label>
          )}
          <button type="submit" disabled={loading || Boolean(authConfigurationError)} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'A processar…' : isPasswordRecovery
              ? 'Guardar nova palavra-passe'
              : passwordLinkMode === 'first-access'
                ? 'Enviar link para criar senha'
                : passwordLinkMode === 'recovery'
                  ? 'Enviar novo link'
                  : 'Entrar no sistema'}
          </button>
          {!isPasswordRecovery && (
            <div className="space-y-2 text-center">
              {passwordLinkMode ? (
                <button type="button" onClick={() => { setPasswordLinkMode(null); setError(''); setSuccess(''); }} className="w-full text-xs font-bold text-blue-700 hover:text-blue-800">
                  Voltar ao início de sessão
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => { setPasswordLinkMode('first-access'); setError(''); setSuccess(''); }} className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
                    Primeiro acesso / Criar palavra-passe
                  </button>
                  <button type="button" onClick={() => { setPasswordLinkMode('recovery'); setError(''); setSuccess(''); }} className="w-full text-xs font-bold text-slate-600 hover:text-blue-800">
                    Esqueci-me da palavra-passe
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </section>
    </main>
  );
};
