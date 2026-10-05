import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone,
  Calendar,
  MessageSquare,
  Shield,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { User as UserType } from '../../types';

interface UserApprovalsProps {
  className?: string;
}

export function UserApprovals({ className = '' }: UserApprovalsProps) {
  const { 
    users, 
    currentUser, 
    approveUser, 
    rejectUser, 
    addNotification 
  } = useAppStore();
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'pending':
        return !user.approved && matchesSearch;
      case 'approved':
        return user.approved && matchesSearch;
      case 'rejected':
        return user.approved === false && user.rejectedAt && matchesSearch;
      default:
        return matchesSearch;
    }
  });

  // Estatísticas
  const stats = {
    pending: users.filter(u => !u.approved && !u.rejectedAt).length,
    approved: users.filter(u => u.approved).length,
    rejected: users.filter(u => u.rejectedAt).length
  };

  const handleApprove = (user: UserType) => {
    if (!currentUser) return;
    
    approveUser(user.id);
    
    // Adicionar notificação para o usuário aprovado
    addNotification({
      userId: user.id,
      type: 'approval',
      title: 'Conta Aprovada',
      message: 'Sua conta foi aprovada e você já pode acessar o sistema.',
      read: false
    });
    
    console.log(`Usuário ${user.name} aprovado por ${currentUser.name}`);
  };

  const handleReject = (user: UserType) => {
    setSelectedUser(user);
    setShowRejectionModal(true);
  };

  const confirmReject = () => {
    if (!selectedUser || !currentUser) return;
    
    rejectUser(selectedUser.id, currentUser.id, rejectionReason);
    
    // Adicionar notificação para o usuário rejeitado
    addNotification({
      userId: selectedUser.id,
      type: 'rejection',
      title: 'Conta Rejeitada',
      message: rejectionReason || 'Sua solicitação de acesso foi rejeitada.',
      read: false
    });
    
    setShowRejectionModal(false);
    setSelectedUser(null);
    setRejectionReason('');
    
    console.log(`Usuário ${selectedUser.name} rejeitado por ${currentUser.name}`);
  };

  const getStatusBadge = (user: UserType) => {
    if (user.approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Aprovado
        </span>
      );
    } else if (user.rejectedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Rejeitado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <Clock className="w-3 h-3" />
          Pendente
        </span>
      );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Aprovações de Usuários
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Gerencie solicitações de acesso ao sistema
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Pendentes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Aprovados</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Rejeitados</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Usuários para Aprovação
          </h3>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">
                {filter === 'pending' ? 'Nenhuma aprovação pendente' : 'Nenhum usuário encontrado'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </h4>
                        {getStatusBadge(user)}
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {user.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Cadastrado em {user.createdAt.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      {user.bio && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {user.bio}
                        </p>
                      )}
                      
                      {/* Informações de aprovação/rejeição */}
                      {user.approved && user.approvedBy && user.approvedAt && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-800 dark:text-green-400">
                            Aprovado em {user.approvedAt.toLocaleDateString('pt-BR')} às {user.approvedAt.toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      {user.rejectedAt && user.rejectedBy && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-800 dark:text-red-400">
                            Rejeitado em {user.rejectedAt.toLocaleDateString('pt-BR')} às {user.rejectedAt.toLocaleTimeString('pt-BR')}
                          </p>
                          {user.rejectionReason && (
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Motivo: {user.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Ações */}
                  {!user.approved && !user.rejectedAt && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(user)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </button>
                      
                      <button
                        onClick={() => handleReject(user)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Rejeição */}
      {showRejectionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Rejeitar Usuário
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedUser.name}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Motivo da rejeição
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                rows={3}
                placeholder="Explique o motivo da rejeição..."
              />
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedUser(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}