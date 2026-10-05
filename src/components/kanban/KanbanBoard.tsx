import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppStore } from '../../store/useAppStore';
import { TaskStatus } from '../../types';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

const statusConfig = {
  para_fazer: {
    title: 'Para Fazer',
    color: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50',
    headerColor: 'text-slate-700 dark:text-slate-300'
  },
  fazendo: {
    title: 'Fazendo',
    color: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    headerColor: 'text-blue-700 dark:text-blue-300'
  },
  aguardando_retorno: {
    title: 'Aguardando Retorno',
    color: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
    headerColor: 'text-yellow-700 dark:text-yellow-300'
  },
  feito: {
    title: 'Feito',
    color: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    headerColor: 'text-green-700 dark:text-green-300'
  },
  longo_prazo: {
    title: 'Longo Prazo',
    color: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
    headerColor: 'text-purple-700 dark:text-purple-300'
  }
};

export function KanbanBoard() {
  const { tasks, updateTaskStatus, setSelectedTask, setTaskModalOpen } = useAppStore();
  const [columnWidth, setColumnWidth] = useState(320);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;
    
    updateTaskStatus(draggableId, newStatus);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setTaskModalOpen(true);
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const statusTasks = getTasksByStatus(status as TaskStatus);

            return (
              <div
                key={status}
                className={`flex-shrink-0 rounded-lg border-2 ${config.color}`}
                style={{ width: `${columnWidth}px` }}
              >
                <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${config.headerColor}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{config.title}</h3>
                    <span className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-sm">
                      {statusTasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 space-y-3 h-full overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      {statusTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                               ref={provided.innerRef}
                               {...provided.draggableProps}
                               {...provided.dragHandleProps}
                               className={`transition-transform ${
                                 snapshot.isDragging ? 'rotate-2 scale-105' : ''
                               }`}
                               onClick={() => handleTaskClick(task.id)}
                             >
                               <KanbanCard task={task} />
                             </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {statusTasks.length === 0 && (
                        <div className="text-center text-slate-400 dark:text-slate-400 py-8">
                          <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Arraste tarefas aqui</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                {/* Resize handle */}
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidth;

                    const handleMouseMove = (e: MouseEvent) => {
                      const newWidth = Math.max(280, Math.min(500, startWidth + (e.clientX - startX)));
                      setColumnWidth(newWidth);
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}