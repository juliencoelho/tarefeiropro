import { KanbanBoard } from '../components/kanban/KanbanBoard';

export function KanbanPage() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Kanban
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize e gerencie suas tarefas por status
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <KanbanBoard />
      </div>
    </div>
  );
}