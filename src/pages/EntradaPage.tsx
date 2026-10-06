import { Sun, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { Task } from '../types';
import { TaskRow } from '../components/tasks/TaskRow';
import { CampoRapido } from '../components/tasks/CampoRapido';
import { ListaVazia } from '../components/tasks/Secao';
import { caixaDeEntrada, novaTarefa } from '../lib/tarefas';

const chip =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors';

function EntradaPage() {
  const { tasks, areas, currentUser, addTask, updateTask, deleteTask } = useAppStore();
  const itens = caixaDeEntrada(tasks);
  const areasAtivas = areas.filter((a) => !a.archived);

  const apagar = (task: Task) => {
    const { id: _id, ...copia } = task;
    deleteTask(task.id);
    toast('Item apagado', {
      action: { label: 'Desfazer', onClick: () => addTask(copia) },
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Caixa de entrada</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Despeje aqui o que vier à cabeça. Depois decida: fazer hoje ou mandar pra uma área.
        </p>
      </header>

      <CampoRapido
        placeholder="Anotar algo… (Enter salva)"
        // No celular o foco automático abriria o teclado a cada visita
        autoFocus={window.matchMedia('(min-width: 768px)').matches}
        onAdd={(title) => addTask(novaTarefa(title, currentUser, { inInbox: true }))}
      />

      {itens.length === 0 ? (
        <ListaVazia>Caixa vazia. Tudo triado.</ListaVazia>
      ) : (
        <ul className="-mx-3">
          {itens.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              rodape={
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => updateTask(task.id, { plannedFor: new Date(), inInbox: false })}
                    className={chip}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Hoje
                  </button>
                  {areasAtivas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => updateTask(task.id, { areaId: area.id, inInbox: false })}
                      className={chip}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                      {area.name}
                    </button>
                  ))}
                </div>
              }
              acoes={
                <button
                  onClick={() => apagar(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Apagar"
                  aria-label="Apagar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default EntradaPage;
