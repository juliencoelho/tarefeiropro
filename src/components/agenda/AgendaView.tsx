import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  Plus,
  Filter
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AgendaView as AgendaViewType, Task } from '../../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addDays, subDays, isSameDay } from 'date-fns';

export function AgendaView() {
  const { tasks, clients, agendaView, setAgendaView, setSelectedTask, setTaskModalOpen } = useAppStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showOnlyEvents, setShowOnlyEvents] = useState(false);

  const navigatePrevious = () => {
    if (agendaView === 'daily') {
      setCurrentDate(subDays(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (agendaView === 'daily') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRange = () => {
    if (agendaView === 'daily') {
      return [currentDate];
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      const matchesDate = isSameDay(taskDate, date);
      const matchesFilter = !showOnlyEvents || task.type === 'evento';
      
      return matchesDate && matchesFilter;
    }).sort((a, b) => {
      // Sort by time if available, then by priority
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      
      const priorityOrder = { 'urgente': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'alta': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'media': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'baixa': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const dateRange = getDateRange();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Agenda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize suas tarefas e eventos por data
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setAgendaView('daily')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                agendaView === 'daily'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setAgendaView('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                agendaView === 'weekly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Semanal
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showOnlyEvents}
                onChange={(e) => setShowOnlyEvents(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Apenas eventos
            </label>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Hoje
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
              {agendaView === 'daily' 
                ? format(currentDate, "EEEE, d 'de' MMMM")
                : `${format(dateRange[0], 'd MMM')} - ${format(dateRange[6], 'd MMM yyyy')}`
              }
            </h2>
            
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`grid gap-4 ${agendaView === 'daily' ? 'grid-cols-1' : 'grid-cols-7'}`}>
        {dateRange.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
                agendaView === 'daily' ? 'min-h-[600px]' : 'min-h-[300px]'
              }`}
            >
              {/* Day Header */}
              <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-medium ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {agendaView === 'daily' 
                        ? format(date, "EEEE")
                        : format(date, "EEE")
                      }
                    </h3>
                    <p className={`text-sm ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {format(date, 'd MMM')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isToday 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {dayTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-4 space-y-2">
                {dayTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    Nenhuma tarefa
                  </p>
                ) : (
                  dayTasks.map(task => {
                    const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          {task.type === 'evento' && (
                            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        {task.startTime && (
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {task.startTime} {task.endTime && `- ${task.endTime}`}
                            </span>
                          </div>
                        )}
                        
                        {client && (
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: client.color }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {client.name}
                            </span>
                          </div>
                        )}
                        
                        {task.description && agendaView === 'daily' && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}