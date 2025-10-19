import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  Clock,
  User,
  MessageCircle,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { format } from 'date-fns';
import { formatDateForDisplay, createLocalDate } from '../../lib/utils';

type SortField = 'title' | 'dueDate' | 'priority' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function TaskList() {
  const { tasks, clients, setSelectedTask, setTaskModalOpen, updateTaskStatus } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const { activeTasks, completedTasks } = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      // Client filter
      const matchesClient = clientFilter === 'all' || task.clientId === clientFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesClient;
    });

    // Separar tarefas ativas das concluídas
    const active = filtered.filter(task => task.status !== 'feito');
    const completed = filtered.filter(task => task.status === 'feito');

    // Função de ordenação
    const sortTasks = (tasksToSort: Task[]) => {
      return tasksToSort.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'dueDate':
            aValue = a.dueDate ? createLocalDate(a.dueDate.toString()).getTime() : 0;
            bValue = b.dueDate ? createLocalDate(b.dueDate.toString()).getTime() : 0;
            break;
          case 'priority':
            const priorityOrder = { 'urgente': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
            aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
            bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    };

    // Função de ordenação específica para tarefas concluídas (sempre por completedAt, mais recente primeiro)
    const sortCompletedTasks = (tasksToSort: Task[]) => {
      return tasksToSort.sort((a, b) => {
        const aCompletedAt = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bCompletedAt = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        
        // Ordenar por completedAt descendente (mais recente primeiro)
        return bCompletedAt - aCompletedAt;
      });
    };

    return {
      activeTasks: sortTasks([...active]),
      completedTasks: sortCompletedTasks([...completed])
    };
  }, [tasks, searchTerm, statusFilter, priorityFilter, clientFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
    navigate({ pathname: location.pathname, search: `?tarefa=${task.id}` });
  };

  const handleCompleteTask = (e: React.MouseEvent<HTMLButtonElement>, taskId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que o clique abra o modal
    updateTaskStatus(taskId, 'feito');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'para_fazer': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'fazendo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'aguardando_retorno': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'feito': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'longo_prazo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'para_fazer': return 'Para Fazer';
      case 'fazendo': return 'Fazendo';
      case 'aguardando_retorno': return 'Aguardando';
      case 'feito': return 'Feito';
      case 'longo_prazo': return 'Longo Prazo';
      default: return status;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <SortAsc className="w-4 h-4" /> : 
      <SortDesc className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lista de Tarefas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTasks.length + completedTasks.length} de {tasks.length} tarefas
          </p>
        </div>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          
          {(statusFilter !== 'all' || priorityFilter !== 'all' || clientFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setClientFilter('all');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos os status</option>
                <option value="para_fazer">Para Fazer</option>
                <option value="fazendo">Fazendo</option>
                <option value="aguardando_retorno">Aguardando Retorno</option>
                <option value="feito">Feito</option>
                <option value="longo_prazo">Longo Prazo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas as prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente
              </label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Active Tasks List */}
      <div className="rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="col-span-4">
            <button
              onClick={() => handleSort('title')}
              className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
            >
              Tarefa
              <SortIcon field="title" />
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => handleSort('status')}
              className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
            >
              Status
              <SortIcon field="status" />
            </button>
          </div>
          <div className="col-span-2">
            <button
              onClick={() => handleSort('dueDate')}
              className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
            >
              Vencimento
              <SortIcon field="dueDate" />
            </button>
          </div>
          <div className="col-span-2">Cliente</div>
          <div className="col-span-1">Progresso</div>
          <div className="col-span-1">Ações</div>
        </div>

        {/* Active Task Rows */}
        <div className="space-y-2">
          {activeTasks.map(task => {
            const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const totalSubtasks = task.subtasks.length;
            
            return (
              <div
                key={task.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors items-center border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {/* Task Title */}
                <div 
                  className="col-span-4 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </h3>
                    {task.type === 'evento' && (
                      <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Status */}
                <div 
                  className="col-span-2 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                {/* Due Date */}
                <div 
                  className="col-span-2 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  {task.dueDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateForDisplay(task.dueDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                {/* Client */}
                <div 
                  className="col-span-2 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  {client ? (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: client.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {client.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                {/* Progress */}
                <div 
                  className="col-span-1 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  {totalSubtasks > 0 ? (
                    <div className="flex items-center gap-1">
                      {completedSubtasks === totalSubtasks ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                {/* Complete Button */}
                <div className="col-span-1">
                  <button
                    onClick={(e) => handleCompleteTask(e, task.id)}
                    className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 transition-colors"
                    title="Concluir tarefa"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State for Active Tasks */}
        {activeTasks.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || clientFilter !== 'all'
                ? 'Nenhuma tarefa ativa encontrada com os filtros aplicados.'
                : 'Nenhuma tarefa ativa encontrada. Crie sua primeira tarefa!'
              }
            </p>
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tarefas Concluídas ({completedTasks.length})
          </h2>
          <div className="rounded-lg overflow-hidden opacity-75">
            {/* Completed Tasks Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="col-span-5">Tarefa</div>
              <div className="col-span-2">Data de Conclusão</div>
              <div className="col-span-2">Vencimento</div>
              <div className="col-span-2">Cliente</div>
              <div className="col-span-1">Progresso</div>
            </div>

            {/* Completed Task Rows */}
            <div className="space-y-2">
              {completedTasks.map(task => {
                const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;
                const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                const totalSubtasks = task.subtasks.length;
                
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="grid grid-cols-12 gap-4 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors items-center border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    {/* Task Title - Strikethrough */}
                    <div className="col-span-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                        <h3 className="font-medium text-gray-500 dark:text-gray-400 truncate line-through">
                          {task.title}
                        </h3>
                        {task.type === 'evento' && (
                          <Clock className="w-3 h-3 text-blue-500 flex-shrink-0 opacity-50" />
                        )}
                      </div>
                    </div>

                    {/* Completion Date */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {task.updatedAt ? format(new Date(task.updatedAt), 'dd/MM/yyyy') : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="col-span-2">
                      {task.dueDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400 opacity-50" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDateForDisplay(task.dueDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Client */}
                    <div className="col-span-2">
                      {client ? (
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0 opacity-50" 
                            style={{ backgroundColor: client.color }}
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {client.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="col-span-1">
                      {totalSubtasks > 0 ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-gray-500">
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}