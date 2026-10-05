import React from 'react';
import { UserFilter } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Search, Filter, Users, UserCheck, UserX, Clock, Shield } from 'lucide-react';

export const UserFilters: React.FC = () => {
  const { userFilters, setUserFilters } = useAppStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFilters({ ...userFilters, search: e.target.value });
  };

  const handleRoleChange = (role: 'admin' | 'user') => {
    setUserFilters({ 
      ...userFilters, 
      role: userFilters.role === role ? undefined : role 
    });
  };

  const handleStatusChange = (status: 'online' | 'offline' | 'approved' | 'pending' | 'rejected') => {
    setUserFilters({ 
      ...userFilters, 
      status: userFilters.status === status ? undefined : status 
    });
  };

  const handleOnlineStatusChange = (onlineStatus: 'online' | 'offline') => {
    setUserFilters({ 
      ...userFilters, 
      onlineStatus: userFilters.onlineStatus === onlineStatus ? undefined : onlineStatus 
    });
  };

  const clearFilters = () => {
    setUserFilters({
      search: '',
      role: undefined,
      status: undefined,
      onlineStatus: undefined,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = userFilters.search || userFilters.role || userFilters.status || userFilters.onlineStatus;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-900">Filtros</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="col-span-full md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={userFilters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Função */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Função
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                userFilters.role === 'admin'
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              onClick={() => handleRoleChange('user')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                userFilters.role === 'user'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuário
            </button>
          </div>
        </div>

        {/* Status de Aprovação */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('approved')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                userFilters.status === 'approved'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Aprovado
            </button>
            <button
              onClick={() => handleStatusChange('pending')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                userFilters.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pendente
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                userFilters.status === 'rejected'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserX className="w-4 h-4" />
              Rejeitado
            </button>
          </div>
        </div>
      </div>

      {/* Status Online */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Status de Conexão
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleOnlineStatusChange('online')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              userFilters.onlineStatus === 'online'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Online
          </button>
          <button
            onClick={() => handleOnlineStatusChange('offline')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              userFilters.onlineStatus === 'offline'
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            Offline
          </button>

        </div>
      </div>

      {/* Ordenação */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Ordenar por
        </label>
        <div className="flex gap-2">
          <select
            value={userFilters.sortBy}
            onChange={(e) => setUserFilters({ ...userFilters, sortBy: e.target.value as any })}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Nome</option>
            <option value="email">Email</option>
            <option value="role">Função</option>
            <option value="createdAt">Data de criação</option>
            <option value="lastLogin">Último login</option>
          </select>
          
          <select
            value={userFilters.sortOrder}
            onChange={(e) => setUserFilters({ ...userFilters, sortOrder: e.target.value as 'asc' | 'desc' })}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {userFilters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Busca: "{userFilters.search}"
              </span>
            )}
            {userFilters.role && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Função: {userFilters.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
            )}
            {userFilters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {
                  userFilters.status === 'approved' ? 'Aprovado' :
                  userFilters.status === 'pending' ? 'Pendente' : 'Rejeitado'
                }
              </span>
            )}
            {userFilters.onlineStatus && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                Conexão: {
                  userFilters.onlineStatus === 'online' ? 'Online' : 'Offline'
                }
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilters;