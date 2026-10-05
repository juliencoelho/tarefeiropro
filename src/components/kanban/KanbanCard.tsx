import { Calendar, Clock, User, Check } from 'lucide-react';
import { Task } from '../../types';
import { format } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import { formatDateForDisplay } from '../../lib/utils';

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { clients, updateTaskStatus } = useAppStore();

  const handleCompleteTask = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    updateTaskStatus(task.id, 'feito');
  };
  
  const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header com prioridade, tipo e botão de concluir */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {task.type === 'evento' && (
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} />
        </div>
        <div className="flex items-center gap-2">
          {task.status !== 'feito' && (
            <button
              onClick={handleCompleteTask}
              className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 transition-colors"
              title="Concluir tarefa"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
          {!task.isVisibleToAll && (
            <div className="w-2 h-2 bg-slate-400 rounded-full" title="Privada" />
          )}
        </div>
      </div>

      {/* Título */}
      <h3 className="font-medium text-slate-900 dark:text-white mb-2 line-clamp-2 text-sm">
        {task.title}
      </h3>

      {/* Cliente */}
      {client && (
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: client.color }}
          />
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
            {client.name}
          </span>
        </div>
      )}

      {/* Data e Hora de Conclusão */}
      {task.dueDate && (
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span>{formatDateForDisplay(task.dueDate)}</span>
            {task.type === 'evento' && task.startTime && (
              <>
                <span>•</span>
                <span>{task.startTime}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}