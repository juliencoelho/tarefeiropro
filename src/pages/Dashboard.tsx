import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  TrendingUp,
  Calendar,
  Plus,
  RotateCcw
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { formatDateForDisplay } from '../lib/utils';

function Dashboard() {
  const { tasks, clients, setTaskModalOpen } = useAppStore();

  // Estatísticas
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'feito').length,
    inProgress: tasks.filter(t => t.status === 'fazendo').length,
    pending: tasks.filter(t => t.status === 'para_fazer').length,
    waiting: tasks.filter(t => t.status === 'aguardando_retorno').length,
    longTerm: tasks.filter(t => t.status === 'longo_prazo').length,
    extended: tasks.filter(t => t.extensionCount && t.extensionCount > 0).length
  };

  // Tarefas próximas do vencimento (próximos 3 dias, não concluídas)
  const upcomingTasks = tasks
    .filter(task => {
      if (!task.dueDate || task.status === 'feito') return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 10);

  // Atividades recentes (criadas ou atualizadas nos últimos 7 dias, máximo 10)
  const recentTasks = tasks
    .filter(task => {
      const taskDate = new Date(task.updatedAt || task.createdAt);
      const today = new Date();
      const diffTime = today.getTime() - taskDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 10);

  // Tarefas prorrogadas (extensionCount > 0)
  const extendedTasks = tasks
    .filter(task => task.extensionCount && task.extensionCount > 0)
    .sort((a, b) => (b.extensionCount || 0) - (a.extensionCount || 0));

  // Tarefas por cliente (2 mais recentes por cliente)
  const tasksByClient = clients.reduce((acc, client) => {
    const clientTasks = tasks
      .filter(task => task.clientId === client.id)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 2);
    
    if (clientTasks.length > 0) {
      acc.push({
        client,
        tasks: clientTasks
      });
    }
    return acc;
  }, [] as Array<{ client: any; tasks: any[] }>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'feito': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'fazendo': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'para_fazer': return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300';
      case 'aguardando_retorno': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'longo_prazo': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'feito': return 'Feito';
      case 'fazendo': return 'Fazendo';
      case 'para_fazer': return 'Para fazer';
      case 'aguardando_retorno': return 'Aguardando';
      case 'longo_prazo': return 'Longo prazo';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Visão geral das suas tarefas e projetos
          </p>
        </div>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total de Tarefas</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Em Andamento</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Concluídas</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Clientes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Prorrogadas</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.extended}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Próximas do Vencimento */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Próximas do Vencimento
              </h2>
            </div>
          </div>
          <div className="p-6">
            {upcomingTasks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-300 text-center py-4">
                Nenhuma tarefa próxima do vencimento
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">
                          {task.dueDate ? formatDateForDisplay(task.dueDate) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Atividades Recentes
              </h2>
            </div>
          </div>
          <div className="p-6">
            {recentTasks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-300 text-center py-4">
                Nenhuma atividade recente
              </p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-300">
                          Atualizada em {task.updatedAt && !isNaN(new Date(task.updatedAt).getTime())
                            ? format(new Date(task.updatedAt), 'dd/MM/yyyy')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tarefas Prorrogadas */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Tarefas Prorrogadas
              </h2>
            </div>
          </div>
          <div className="p-6">
            {extendedTasks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-300 text-center py-4">
                Nenhuma tarefa foi prorrogada
              </p>
            ) : (
              <div className="space-y-4">
                {extendedTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-orange-500">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white mb-2">{task.title}</h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                          {task.extensionCount} prorrogaç{task.extensionCount === 1 ? 'ão' : 'ões'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {task.originalDueDate && (
                          <div>
                            <span className="font-medium">Data original:</span> {formatDateForDisplay(task.originalDueDate)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Data atual:</span> {task.dueDate ? formatDateForDisplay(task.dueDate) : '-'}
                        </div>
                        {task.lastExtensionDate && (
                          <div>
                            <span className="font-medium">Última prorrogação:</span> {formatDateForDisplay(task.lastExtensionDate)}
                          </div>
                        )}
                        {task.extensionReason && (
                          <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                            <span className="font-medium">Motivo:</span> {task.extensionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tarefas por Cliente */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Tarefas por Cliente
              </h2>
            </div>
          </div>
          <div className="p-6">
            {tasksByClient.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-300 text-center py-4">
                Nenhuma tarefa encontrada
              </p>
            ) : (
              <div className="space-y-4">
                {tasksByClient.map(({ client, tasks }) => (
                  <div key={client.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{client.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{tasks.length} tarefa(s)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-300">
                              {task.dueDate ? formatDateForDisplay(task.dueDate) : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;