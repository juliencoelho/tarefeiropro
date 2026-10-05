import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Trash2,
  Plus,
  Users,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { UserInvite } from '../../types';

interface UserInvitesProps {
  className?: string;
}

export function UserInvites({ className = '' }: UserInvitesProps) {
  const { 
    userInvites, 
    currentUser, 
    addUserInvite, 
    updateUserInvite, 
    deleteUserInvite 
  } = useAppStore();
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user' as 'admin' | 'user',
    message: ''
  });

  // Filtrar convites por status
  const pendingInvites = userInvites.filter(invite => invite.status === 'pending');
  const acceptedInvites = userInvites.filter(invite => invite.status === 'accepted');
  const expiredInvites = userInvites.filter(invite => invite.status === 'expired');

  const handleSendInvite = () => {
    if (!inviteForm.email.trim()) return;

    const newInvite: UserInvite = {
      id: Date.now().toString(),
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'pending',
      invitedBy: currentUser!.id,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      token: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      message: inviteForm.message || undefined
    };

    addUserInvite(newInvite);
    
    // Reset form
    setInviteForm({
      email: '',
      role: 'user',
      message: ''
    });
    setIsInviteModalOpen(false);

    // Simular envio de email (em produção, seria uma chamada para API)
    console.log('Convite enviado para:', inviteForm.email);
  };

  const handleResendInvite = (invite: UserInvite) => {
    const updatedInvite = {
      ...invite,
      status: 'pending' as const,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    updateUserInvite(invite.id, updatedInvite);
    console.log('Convite reenviado para:', invite.email);
  };

  const handleCopyInviteLink = (invite: UserInvite) => {
    const inviteLink = `${window.location.origin}/convite/${invite.token}`;
    navigator.clipboard.writeText(inviteLink);
    // Em uma implementação real, mostraria uma notificação de sucesso
    console.log('Link copiado:', inviteLink);
  };

  const handleDeleteInvite = (inviteId: string) => {
    if (confirm('Tem certeza que deseja excluir este convite?')) {
      deleteUserInvite(inviteId);
    }
  };

  const getStatusIcon = (status: UserInvite['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: UserInvite['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: UserInvite['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Convites de Usuários
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Gerencie convites para novos membros da equipe
          </p>
        </div>
        
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enviar Convite
        </button>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingInvites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Aceitos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{acceptedInvites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Expirados</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{expiredInvites.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Convites */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Convites Enviados
          </h3>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {userInvites.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">
                Nenhum convite enviado ainda
              </p>
            </div>
          ) : (
            userInvites.map((invite) => (
              <div key={invite.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                          {getStatusIcon(invite.status)}
                          {getStatusText(invite.status)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">
                          {invite.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-slate-600 dark:text-slate-300 mr-4">
                      <p>Enviado em {invite.invitedAt.toLocaleDateString('pt-BR')}</p>
                      <p>Expira em {invite.expiresAt.toLocaleDateString('pt-BR')}</p>
                    </div>
                    
                    {invite.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleCopyInviteLink(invite)}
                          className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Copiar link do convite"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleResendInvite(invite)}
                          className="p-2 text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          title="Reenviar convite"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Excluir convite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {invite.message && (
                  <div className="mt-3 ml-14">
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                      {invite.message}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Novo Convite */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Enviar Convite
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="usuario@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Função
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows={3}
                  placeholder="Mensagem personalizada para o convite..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteForm.email.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                Enviar Convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}