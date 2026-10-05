import React, { useState } from 'react';
import { User } from '../../types';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User as UserIcon,
  Clock,
  Activity,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

interface UserCardProps {
  user: User;
  currentUser: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUser,
  onEdit,
  onDelete,
  onApprove,
  onReject
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = () => {
    if (!user.approved) return 'bg-yellow-100 text-yellow-800';
    if (user.isOnline) return 'bg-green-100 text-green-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getStatusText = () => {
    if (!user.approved) return 'Pendente';
    if (user.isOnline) return 'Online';
    return 'Offline';
  };

  const canManageUser = currentUser.role === 'admin' && currentUser.id !== user.id;

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-500" />
              </div>
            )}
            
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              user.isOnline ? 'bg-green-500' : 'bg-slate-400'
            }`} />
          </div>

          {/* Informações do usuário */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 truncate">{user.name}</h4>
              
              {user.role === 'admin' && (
                <Shield className="w-4 h-4 text-purple-600" aria-label="Administrador" />
              )}
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>

          {/* Estatísticas */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-slate-900">{user.stats?.totalTasks || 0}</p>
              <p className="text-slate-600">Tarefas</p>
            </div>
            
            <div className="text-center">
              <p className="font-semibold text-slate-900">{user.stats?.productivityScore || 0}%</p>
              <p className="text-slate-600">Produtividade</p>
            </div>
            
            <div className="text-center">
              <p className="text-slate-600">Último acesso</p>
              <p className="font-medium text-slate-900">
                {user.isOnline ? 'Agora' : formatDate(user.lastLogin)}
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        {canManageUser && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onEdit(user);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar usuário
                  </button>

                  {!user.approved && (
                    <>
                      <button
                        onClick={() => {
                          onApprove(user.id);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar usuário
                      </button>

                      <button
                        onClick={() => {
                          onReject(user.id);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar usuário
                      </button>
                    </>
                  )}

                  <hr className="my-1" />
                  
                  <button
                    onClick={() => {
                      onDelete(user.id);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover usuário
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informações adicionais em mobile */}
      <div className="md:hidden mt-3 pt-3 border-t border-slate-200">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-slate-600">Tarefas: </span>
            <span className="font-medium">{user.stats?.totalTasks || 0}</span>
          </div>
          <div>
            <span className="text-slate-600">Produtividade: </span>
            <span className="font-medium">{user.stats?.productivityScore || 0}%</span>
          </div>
        </div>
        
        <div className="mt-2 text-sm">
          <span className="text-slate-600">Último acesso: </span>
          <span className="font-medium">
            {user.isOnline ? 'Agora' : formatDate(user.lastLogin)}
          </span>
        </div>
      </div>

      {/* Overlay para fechar menu de ações */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default UserCard;