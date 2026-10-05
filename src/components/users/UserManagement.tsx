import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { mockUsers, mockUserInvites, mockNotifications, mockUserSessions } from '../../data/mockData';
import { User, UserFilter } from '../../types';
import { UserCard } from './UserCard';
import { UserModal } from './UserModal';
import { UserFilters } from './UserFilters';

import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Activity,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    users,
    userInvites,
    notifications,
    userSessions,
    currentUser,
    userFilters,
    isUserModalOpen,
    selectedUser,
    setUsers,
    setUserInvites,
    setNotifications,
    setUserSessions,
    setUserModalOpen,
    setSelectedUser,
    setUserFilters,
    addUser,
    updateUser,
    deleteUser,
    approveUser,
    rejectUser,
    addUserInvite
  } = useAppStore();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Carregar dados mock na inicialização
  useEffect(() => {
    if (users.length === 0) {
      setUsers(mockUsers);
      setUserInvites(mockUserInvites);
      setNotifications(mockNotifications);
      setUserSessions(mockUserSessions);
    }
  }, [users.length, setUsers, setUserInvites, setNotifications, setUserSessions]);

  // Filtrar usuários baseado nos filtros ativos
  const filteredUsers = users.filter(user => {
    const matchesSearch = !userFilters.search || 
      user.name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilters.search.toLowerCase());
    
    const matchesRole = !userFilters.role || user.role === userFilters.role;
    
    const matchesApproved = userFilters.approved === undefined || user.approved === userFilters.approved;
    
    const matchesStatus = !userFilters.status || 
      (userFilters.status === 'online' && user.isOnline) ||
      (userFilters.status === 'offline' && !user.isOnline);

    return matchesSearch && matchesRole && matchesApproved && matchesStatus;
  });

  // Estatísticas dos usuários
  const stats = {
    total: users.length,
    online: users.filter(u => u.isOnline).length,
    pending: users.filter(u => !u.approved).length,
    admins: users.filter(u => u.role === 'admin').length
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      deleteUser(userId);
    }
  };

  const handleApproveUser = (userId: string) => {
    approveUser(userId);
  };

  const handleRejectUser = (userId: string) => {
    const reason = window.prompt('Motivo da rejeição (opcional):');
    if (window.confirm('Tem certeza que deseja rejeitar este usuário?')) {
      rejectUser(userId, currentUser.id, reason || undefined);
    }
  };

  const handleInviteUser = (email: string) => {
    addUserInvite({
      email,
      role: 'user', // Papel padrão para novos usuários convidados
      invitedBy: currentUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    });
    setIsInviteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gestão de Usuários
          </h2>
          <p className="text-slate-600 mt-1">
            Gerencie usuários, permissões e convites da equipe
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Convidar Usuário
          </button>
          
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Online Agora</p>
              <p className="text-2xl font-bold text-slate-900">{stats.online}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pendentes</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Administradores</p>
              <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={userFilters.search}
              onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <UserFilters />
        )}
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Usuários ({filteredUsers.length})
          </h3>
        </div>
        
        <div className="divide-y divide-slate-200">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                currentUser={currentUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onApprove={handleApproveUser}
                onReject={handleRejectUser}
              />
            ))
          )}
        </div>
      </div>

      {/* Modais */}
      {isUserModalOpen && (
        <UserModal
          user={selectedUser}
          isOpen={isUserModalOpen}
          onClose={() => setUserModalOpen(false)}
        />
      )}


    </div>
  );
};