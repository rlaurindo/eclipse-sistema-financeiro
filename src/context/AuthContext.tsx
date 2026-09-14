import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserSession, UserAccount, ViewPreferences } from '../types.ts';

interface AuthContextType {
  user: UserSession;
  isAdmin: boolean;
  isReadOnly: boolean;
  isViewer: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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

const defaultAdminSession: UserSession = {
  id: 'usr-admin-1',
  role: 'admin',
  name: 'Administrador Geral',
  email: 'admin@obras.pt'
};

const defaultUserSession: UserSession = {
  id: 'usr-user-1',
  role: 'user',
  name: 'Eng. João Silva',
  email: 'user@obras.pt'
};

const defaultViewPreferences: ViewPreferences = {
  privacyMode: false,
  displayDensity: 'comfortable',
  summaryDetailLevel: 'executive',
  showMarginAlerts: true,
  activePartnerFilter: 'all'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem('app_user_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) return parsed;
      } catch (e) {
        console.warn('Error parsing saved session:', e);
      }
    }
    return defaultAdminSession;
  });

  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>(() => {
    const saved = localStorage.getItem('app_view_preferences');
    if (saved) {
      try {
        return { ...defaultViewPreferences, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Error parsing view preferences:', e);
      }
    }
    return defaultViewPreferences;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usersList, setUsersList] = useState<UserAccount[]>([]);

  useEffect(() => {
    localStorage.setItem('app_user_session', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('app_view_preferences', JSON.stringify(viewPreferences));
  }, [viewPreferences]);

  const togglePrivacyMode = () => {
    setViewPreferences((prev) => ({ ...prev, privacyMode: !prev.privacyMode }));
  };

  const refreshUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const list = await res.json();
        setUsersList(list);
      }
    } catch (err) {
      console.warn('Failed to fetch users list:', err);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const login = async (email: string, password: string = 'admin'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Falha no login' }));
        return { success: false, error: errData.error || 'Credenciais inválidas' };
      }

      const userData = await res.json();
      const session: UserSession = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      };

      setUser(session);
      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão com servidor' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Falha no cadastro' }));
        return { success: false, error: errData.error || 'Erro ao registrar usuário' };
      }

      const userData = await res.json();
      const session: UserSession = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      };

      setUser(session);
      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao conectar com servidor' };
    }
  };

  const updateUserRole = async (
    id: string,
    newRole: UserRole,
    name?: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role
        },
        body: JSON.stringify({ role: newRole, name, email })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Falha ao atualizar permissões' }));
        return { success: false, error: err.error };
      }

      // If updating currently logged in user, update session
      if (user.id === id) {
        setUser((prev) => ({
          ...prev,
          role: newRole,
          name: name || prev.name,
          email: email || prev.email
        }));
      }

      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão' };
    }
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': user.role }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Falha ao excluir usuário' }));
        return { success: false, error: err.error };
      }

      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir' };
    }
  };

  const switchRole = (newRole: UserRole, pin?: string): boolean => {
    if (newRole === 'admin') {
      if (!pin || pin === '1234' || pin === 'admin' || pin === '0000' || pin === '') {
        setUser(defaultAdminSession);
        return true;
      }
      return false;
    } else {
      setUser(defaultUserSession);
      return true;
    }
  };

  const logout = () => {
    setUser(defaultUserSession);
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const formatCurrency = (val: number | string | undefined | null): string => {
    if (viewPreferences.privacyMode) return '•••••• €';
    if (val === undefined || val === null || val === '') return '0,00 €';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatNumber = (val: number | string | undefined | null): string => {
    if (viewPreferences.privacyMode) return '••••••';
    if (val === undefined || val === null || val === '') return '0,00';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0;
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPercent = (val: number | string | undefined | null): string => {
    if (viewPreferences.privacyMode) return '••••••%';
    if (val === undefined || val === null || val === '') return '0,0%';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.')) || 0;
    return `${num.toFixed(1)}%`;
  };

  const formatDate = (isoDate: string | undefined): string => {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoDate;
    }
  };

  const isAdmin = user.role === 'admin';
  const isReadOnly = !isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isReadOnly,
        isViewer: isReadOnly,
        login,
        register,
        switchRole,
        logout,
        usersList,
        refreshUsers,
        updateUserRole,
        deleteUser,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        viewPreferences,
        setViewPreferences,
        togglePrivacyMode,
        formatCurrency,
        formatNumber,
        formatPercent,
        formatDate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
