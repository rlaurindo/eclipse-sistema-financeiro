import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, UserSession, UserAccount, ViewPreferences } from '../types.ts';
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts';

interface AuthContextType {
  user: UserSession;
  isAuthenticated: boolean;
  authLoading: boolean;
  authConfigurationError: string;
  isPasswordRecovery: boolean;
  isAdmin: boolean;
  isReadOnly: boolean;
  isViewer: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string, options?: { signOut?: boolean }) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  switchRole: (newRole: UserRole, pin?: string) => boolean;
  logout: () => void;
  usersList: UserAccount[];
  refreshUsers: () => Promise<void>;
  updateUserRole: (id: string, newRole: UserRole, name?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  viewPreferences: ViewPreferences;
  setViewPreferences: React.Dispatch<React.SetStateAction<ViewPreferences>>;
  togglePrivacyMode: () => void;
  formatCurrency: (value: number | string | undefined | null) => string;
  formatNumber: (value: number | string | undefined | null) => string;
  formatPercent: (value: number | string | undefined | null) => string;
  formatDate: (isoDate: string | undefined) => string;
}

const anonymousUser: UserSession = { id: '', role: 'viewer', name: '', email: '' };
const defaultViewPreferences: ViewPreferences = {
  privacyMode: false,
  displayDensity: 'comfortable',
  summaryDetailLevel: 'executive',
  showMarginAlerts: true,
  activePartnerFilter: 'all'
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(anonymousUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(() => {
    const saved = localStorage.getItem('app_view_preferences');
    if (!saved) return defaultViewPreferences;
    try { return { ...defaultViewPreferences, ...JSON.parse(saved) }; }
    catch { return defaultViewPreferences; }
  });

  const loadAuthenticatedUser = async (authUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) => {
    let role: UserRole = authUser.app_metadata?.role === 'admin' ? 'admin' : 'viewer';
    let profileName = typeof authUser.user_metadata?.name === 'string' ? authUser.user_metadata.name : '';
    if (supabase) {
      const { data: memberships, error: membershipError } = await supabase.from('organization_members').select('role').eq('user_id', authUser.id);
      if (membershipError) console.error('Não foi possível consultar as permissões do utilizador.', membershipError);
      else if (memberships?.some((membership) => membership.role === 'admin')) role = 'admin';
      else if (memberships?.some((membership) => membership.role === 'viewer')) role = 'viewer';
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', authUser.id).maybeSingle();
      if (profile?.name) profileName = profile.name;
    }
    setUser({ id: authUser.id, email: authUser.email || '', name: profileName || authUser.email?.split('@')[0] || 'Utilizador', role });
  };

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) await loadAuthenticatedUser(data.session.user);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (session?.user) void loadAuthenticatedUser(session.user);
      else setUser(anonymousUser);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem('app_view_preferences', JSON.stringify(viewPreferences)); }, [viewPreferences]);

  const login = async (email: string, password = '') => {
    if (!supabase) return { success: false, error: 'Supabase não configurado no Netlify.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return { success: false, error: error?.message || 'Credenciais inválidas.' };
    await loadAuthenticatedUser(data.user);
    setAuthModalOpen(false);
    return { success: true };
  };
  const updatePassword = async (password: string, options?: { signOut?: boolean }) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    if (options?.signOut !== false) {
      await supabase.auth.signOut();
      setIsPasswordRecovery(false);
      setUser(anonymousUser);
    }
    return { success: true };
  };
  const requestPasswordReset = async (email: string) => {
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`
    });
    return error ? { success: false, error: error.message } : { success: true };
  };
  const callUserAdmin = async (body: Record<string, unknown>) => {
    if (!supabase) return { data: null, error: 'Supabase não configurado.' };
    const { data, error } = await supabase.functions.invoke('admin-users', { body });
    let message = data?.error || error?.message || null;
    const response = (error as { context?: Response } | null)?.context;
    if (response) {
      try {
        const payload = await response.clone().json();
        if (payload?.error) message = payload.error;
      } catch {
        // Mantém a mensagem original quando a resposta não contém JSON.
      }
    }
    if (message && /already.*registered|already exists|email.*exists/i.test(message)) {
      message = 'Este e-mail já está cadastrado no Supabase. Utilize a conta existente ou escolha outro e-mail.';
    }
    return { data, error: message };
  };
  const refreshUsers = async () => {
    if (!supabase || user.role !== 'admin') { setUsersList([]); return; }
    const { data, error } = await callUserAdmin({ action: 'list' });
    if (error) { console.error('Não foi possível carregar os utilizadores.', error); return; }
    setUsersList((data?.users || []).map((item: any) => ({
      id: item.id,
      email: item.email || '',
      name: item.name || item.email?.split('@')[0] || 'Utilizador',
      role: item.role === 'admin' ? 'admin' : 'user',
      createdAt: item.createdAt,
      lastLoginAt: item.lastLoginAt
    })));
  };
  const register = async (name: string, email: string, password: string, role: UserRole) => {
    if (user.role !== 'admin') return { success: false, error: 'Apenas administradores podem criar utilizadores.' };
    const { error } = await callUserAdmin({ action: 'create', name, email, password, role: role === 'admin' ? 'admin' : 'viewer' });
    if (error) return { success: false, error };
    await refreshUsers();
    return { success: true };
  };
  const logout = () => { if (supabase) void supabase.auth.signOut(); setUser(anonymousUser); setAuthModalOpen(false); };
  const updateUserRole = async (id: string, newRole: UserRole, name?: string, email?: string) => {
    if (user.role !== 'admin') return { success: false, error: 'Apenas administradores podem alterar utilizadores.' };
    const { error } = await callUserAdmin({ action: 'update', userId: id, role: newRole === 'admin' ? 'admin' : 'viewer', name, email });
    if (error) return { success: false, error };
    await refreshUsers();
    return { success: true };
  };
  const deleteUser = async (id: string) => {
    if (user.role !== 'admin') return { success: false, error: 'Apenas administradores podem remover utilizadores.' };
    if (id === user.id) return { success: false, error: 'Não pode remover a própria conta.' };
    const { error } = await callUserAdmin({ action: 'delete', userId: id });
    if (error) return { success: false, error };
    await refreshUsers();
    return { success: true };
  };
  const switchRole = () => false;
  const togglePrivacyMode = () => setViewPreferences((prev) => ({ ...prev, privacyMode: !prev.privacyMode }));
  const parseValue = (val: number | string | undefined | null) => typeof val === 'number' ? val : parseFloat(String(val ?? '').replace(',', '.')) || 0;
  const formatCurrency = (val: number | string | undefined | null) => viewPreferences.privacyMode ? '•••••• €' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseValue(val));
  const formatNumber = (val: number | string | undefined | null) => viewPreferences.privacyMode ? '••••••' : new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseValue(val));
  const formatPercent = (val: number | string | undefined | null) => viewPreferences.privacyMode ? '••••••%' : `${parseValue(val).toFixed(1)}%`;
  const formatDate = (isoDate: string | undefined) => {
    if (!isoDate) return '-';
    try { return new Date(isoDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return isoDate; }
  };

  const isAuthenticated = Boolean(user.id);
  const isAdmin = isAuthenticated && user.role === 'admin';
  const isReadOnly = !isAdmin;
  useEffect(() => { if (isAdmin) void refreshUsers(); else setUsersList([]); }, [isAdmin, user.id]);
  return <AuthContext.Provider value={{
    user, isAuthenticated, authLoading, isPasswordRecovery,
    authConfigurationError: isSupabaseConfigured ? '' : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no Netlify.',
    isAdmin, isReadOnly, isViewer: isReadOnly, login, requestPasswordReset, updatePassword, register, switchRole, logout,
    usersList, refreshUsers, updateUserRole, deleteUser,
    authModalOpen, setAuthModalOpen, authMode, setAuthMode, viewPreferences, setViewPreferences,
    togglePrivacyMode, formatCurrency, formatNumber, formatPercent, formatDate
  }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
