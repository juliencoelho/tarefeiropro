import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { User } from '../../types';

interface UserReportsProps {
  className?: string;
}

export function UserReports({ className = '' }: UserReportsProps) {
  const { users, tasks } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Calcular estatísticas gerais
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isOnline).length;
  const approvedUsers = users.filter(u => u.approved).length;
  const pendingUsers = users.filter(u => !u.approved).length;

  // Calcular produtividade por usuário
  const userProductivity = users.map(user => {
    const userTasks = tasks.filter(task => 
      task.assignedTo.some(assigned => assigned.id === user.id)
    );
    
    const completedTasks = userTasks.filter(task => task.status === 'feito').length;
    const totalTasks = userTasks.length;
    const productivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      user,
      totalTasks,
      completedTasks,
      productivity: Math.round(productivity)
    };
  }).sort((a, b) => b.productivity - a.productivity);

  // Top performers (top 5)
  const topPerformers = userProductivity.slice(0, 5);

  // Usuários que precisam de atenção (baixa produtividade)
  const needsAttention = userProductivity.filter(up => up.productivity < 50 && up.totalTasks > 0);

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      summary: {
        totalUsers,
        activeUsers,
        approvedUsers,
        pendingUsers
      },
      productivity: userProductivity,
      topPerformers,
      needsAttention
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-usuarios-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Relatórios de Usuários
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Análise de produtividade e estatísticas da equipe
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
          
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total de Usuários</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Usuários Ativos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Aprovados</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{approvedUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Pendentes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingUsers}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Top Performers
          </h3>
        </div>
        
        <div className="space-y-4">
          {topPerformers.map((performer, index) => (
            <div key={performer.user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-semibold">
                  {index + 1}
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={performer.user.avatar}
                    alt={performer.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {performer.user.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {performer.completedTasks}/{performer.totalTasks} tarefas
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${performer.productivity}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {performer.productivity}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usuários que Precisam de Atenção */}
      {needsAttention.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Usuários que Precisam de Atenção
            </h3>
          </div>
          
          <div className="space-y-3">
            {needsAttention.map((user) => (
              <div key={user.user.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <img
                    src={user.user.avatar}
                    alt={user.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {user.user.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {user.completedTasks}/{user.totalTasks} tarefas concluídas
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    {user.productivity}% produtividade
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Precisa de suporte
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}