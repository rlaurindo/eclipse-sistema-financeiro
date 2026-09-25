import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sliders, 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  Check, 
  Settings2, 
  Sparkles, 
  Layout, 
  DollarSign, 
  FileText,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useAppDialog } from '../context/AppDialogContext.tsx';
import { UserAccount, UserRole, SystemSettings } from '../types.ts';

interface UserManagementViewProps {
  settings: SystemSettings;
  onUpdateSettings?: (settings: SystemSettings) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const { confirmAction } = useAppDialog();
  const { 
    user: currentUser, 
    isAdmin, 
    usersList, 
    updateUserRole, 
    deleteUser, 
    register, 
    viewPreferences, 
    setViewPreferences,
    togglePrivacyMode
  } = useAuth();

  // Create User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');

  const showFeedbackMsg = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedbackMsg('error', 'Apenas administradores podem cadastrar novos usuários.');
      return;
    }
    if (!newName || !newEmail || !newPassword) {
      showFeedbackMsg('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setActionLoading(true);
    const res = await register(newName, newEmail, newPassword, newRole);
    setActionLoading(false);

    if (res.success) {
      showFeedbackMsg('success', `Usuário "${newName}" criado com sucesso com perfil ${newRole.toUpperCase()}!`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      setShowAddUser(false);
    } else {
      showFeedbackMsg('error', res.error || 'Erro ao criar usuário.');
    }
  };

  const handleRoleToggle = async (targetUser: UserAccount) => {
    if (!isAdmin) {
      showFeedbackMsg('error', 'Apenas administradores podem alterar perfis.');
      return;
    }
    const updatedRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setActionLoading(true);
    const res = await updateUserRole(targetUser.id, updatedRole);
    setActionLoading(false);

    if (res.success) {
      showFeedbackMsg('success', `Perfil de ${targetUser.name} alterado para ${updatedRole.toUpperCase()}!`);
    } else {
      showFeedbackMsg('error', res.error || 'Falha ao alterar perfil.');
    }
  };

  const handleDelete = async (targetUser: UserAccount) => {
    if (!isAdmin) {
      showFeedbackMsg('error', 'Apenas administradores podem remover usuários.');
      return;
    }
    if (targetUser.id === currentUser.id) {
      showFeedbackMsg('error', 'Você não pode excluir sua própria conta enquanto estiver conectado.');
      return;
    }
    if (!await confirmAction({
      title: 'Remover utilizador',
      message: `Deseja remover o utilizador "${targetUser.name}" (${targetUser.email})?`,
      confirmLabel: 'Remover utilizador'
    })) {
      return;
    }

    setActionLoading(true);
    const res = await deleteUser(targetUser.id);
    setActionLoading(false);

    if (res.success) {
      showFeedbackMsg('success', `Usuário "${targetUser.name}" removido com sucesso.`);
    } else {
      showFeedbackMsg('error', res.error || 'Erro ao remover usuário.');
    }
  };

  const startEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const saveEdit = async (userId: string) => {
    if (!isAdmin) return;
    setActionLoading(true);
    const res = await updateUserRole(userId, editRole, editName, editEmail);
    setActionLoading(false);

    if (res.success) {
      showFeedbackMsg('success', 'Dados do usuário atualizados com sucesso!');
      setEditingUserId(null);
    } else {
      showFeedbackMsg('error', res.error || 'Erro ao atualizar usuário.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl">
              <Sliders className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Painel de Controle de Usuários & Tipos de Visualização
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  RBAC & Preferências
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gerencie permissões de acesso (Admin vs. Leitura), contas de usuários e parametrize os modos de exibição do sistema.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddUser ? 'Fechar Cadastro' : 'Novo Usuário'}</span>
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Grid: Left = User Accounts Management | Right = View Preferences & Display Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: User Accounts Table & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add User Modal / Inline Form */}
          {showAddUser && isAdmin && (
            <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Cadastrar Novo Usuário no Sistema
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Engenheiro Mateus Alves"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mateus@obras.pt"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Senha de Acesso</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Perfil de Permissão</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                  >
                    <option value="user">👁️ User (Somente Leitura e Relatórios)</option>
                    <option value="admin">🛡️ Admin (Leitura + Edição Total)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Criar Conta</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Usuários Registrados & Controle de Acesso ({usersList.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Sessão atual: <strong className="text-slate-800">{currentUser.name}</strong>
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {usersList.map((usr) => {
                const isCurrent = usr.id === currentUser.id;
                const isEditing = editingUserId === usr.id;

                if (isEditing) {
                  return (
                    <div key={usr.id} className="py-3.5 space-y-3 bg-blue-50/50 p-3 rounded-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                        />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
                        />
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-900"
                        >
                          <option value="user">User (Leitura)</option>
                          <option value="admin">Admin (Total)</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(usr.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={usr.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${
                        usr.role === 'admin' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {usr.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{usr.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                              Você (Ativo)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          <span>{usr.email}</span>
                          {usr.lastLoginAt && (
                            <span className="text-[10px] text-slate-400">
                              • Acesso: {new Date(usr.lastLoginAt).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Role Badge / Switcher */}
                      <button
                        onClick={() => handleRoleToggle(usr)}
                        disabled={!isAdmin || isCurrent}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          usr.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        } ${(!isAdmin || isCurrent) ? 'opacity-80 cursor-default' : ''}`}
                        title={isAdmin && !isCurrent ? 'Clique para alternar permissão (Admin/User)' : 'Perfil do usuário'}
                      >
                        {usr.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
                        <span>{usr.role === 'admin' ? 'ADMIN (Total)' : 'USER (Leitura)'}</span>
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => startEdit(usr)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Editar Dados do Usuário"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(usr)}
                            disabled={isCurrent}
                            className={`p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer ${
                              isCurrent ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={isCurrent ? 'Não é possível excluir a conta ativa' : 'Excluir Usuário'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Control Panel for Display Types & View Preferences */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layout className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Tipos de Visualização & Preferências
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option 1: Privacy Mode (Masking Values) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    {viewPreferences.privacyMode ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-blue-600" />}
                    Modo Privacidade (Ocultar Valores)
                  </div>
                  <button
                    onClick={togglePrivacyMode}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      viewPreferences.privacyMode ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        viewPreferences.privacyMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Substitui valores monetários por <code>•••••• €</code> para apresentações a clientes ou reuniões com terceiros.
                </p>
              </div>

              {/* Option 2: Table Density */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800">Densidade das Tabelas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setViewPreferences((p) => ({ ...p, displayDensity: 'comfortable' }))}
                    className={`p-2 rounded-lg border text-center font-semibold transition cursor-pointer ${
                      viewPreferences.displayDensity === 'comfortable'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Confortável
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewPreferences((p) => ({ ...p, displayDensity: 'compact' }))}
                    className={`p-2 rounded-lg border text-center font-semibold transition cursor-pointer ${
                      viewPreferences.displayDensity === 'compact'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Compacto
                  </button>
                </div>
              </div>

              {/* Option 3: Margin Alerts */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">Alertas Visuais de Margem</div>
                  <button
                    onClick={() => setViewPreferences((p) => ({ ...p, showMarginAlerts: !p.showMarginAlerts }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      viewPreferences.showMarginAlerts ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        viewPreferences.showMarginAlerts ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Destaque automático para margens operacionais inferiores a 20% ou variações atípicas de despesas.
                </p>
              </div>

              {/* Option 4: Partner Focus Filter */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800">Filtro Padrão de Sócios</label>
                <select
                  value={viewPreferences.activePartnerFilter}
                  onChange={(e) => setViewPreferences((p) => ({ ...p, activePartnerFilter: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs"
                >
                  <option value="all">👥 Todos os Sócios (Visão Plena)</option>
                  {settings.partners.map((pt) => (
                    <option key={pt.id} value={pt.name}>
                      👤 {pt.name} ({pt.percentage}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Role Access Matrix Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Matriz de Privilégios (RBAC)
              </h4>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="flex items-start gap-2 p-2 bg-amber-50/60 rounded-lg border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900">ADMINISTRADOR:</strong> Leitura, edição de custos/receitas, criação de novos períodos, exclusão, gestão de sócios e parametrização.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-blue-50/60 rounded-lg border border-blue-200">
                <Eye className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900">USUÁRIO (LEITOR):</strong> Acesso livre para consulta de planilhas, relatórios de sócios, matriz de faturamento e exportação de relatórios.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
