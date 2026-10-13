import { Building2, Calendar, CalendarCheck, Check, Clock, History, LifeBuoy, Link2, ListTodo, Mail, Sparkles } from 'lucide-react';
import { OrigemTarefa, Task } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { corPrioridade, diaDe, hojeStr, rotuloOrigem, rotuloPrioridade, vinculosDe } from '../../lib/tarefas';

const iconeOrigem: Partial<Record<OrigemTarefa, typeof Mail>> = {
  cowork: Sparkles,
  basepro: CalendarCheck,
  nexo: LifeBuoy,
  email: Mail,
  todo: ListTodo,
};

interface TaskRowProps {
  task: Task;
  // Botões à direita (ex.: "Puxar pra hoje")
  acoes?: React.ReactNode;
  // Conteúdo abaixo do título (ex.: botões de triagem da caixa de entrada)
  rodape?: React.ReactNode;
  mostrarArea?: boolean;
}

function rotuloDoPrazo(prazo: string, hoje: string): string {
  const amanha = diaDe(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [ano, mes, dia] = prazo.split('-');
  const curto = ano === hoje.slice(0, 4) ? `${dia}/${mes}` : `${dia}/${mes}/${ano}`;
  if (prazo === hoje) return 'Hoje';
  if (prazo === amanha) return 'Amanhã';
  if (prazo < hoje) return `Atrasada · ${curto}`;
  return curto;
}

export function TaskRow({ task, acoes, rodape, mostrarArea = true }: TaskRowProps) {
  const { areas, clients, tasks, taskLinks, updateTaskStatus, setSelectedTask, setTaskModalOpen } = useAppStore();
  const hoje = hojeStr();
  const vinculos = vinculosDe(task.id, taskLinks, tasks);
  const esperando = vinculos.filter((v) => v.sentido === 'depende' && v.outra.status !== 'feito').length;
  const IconeOrigem = task.source ? iconeOrigem[task.source] : undefined;
  const feita = task.status === 'feito';
  const prazo = diaDe(task.dueDate);
  const atrasada = !feita && prazo !== '' && prazo < hoje;
  const planejada = diaDe(task.plannedFor);
  const ficouPraTras = !feita && planejada !== '' && planejada < hoje;
  const area = mostrarArea && task.areaId ? areas.find((a) => a.id === task.areaId) : undefined;
  const cliente = task.clientId ? clients.find((c) => c.id === task.clientId) : undefined;

  const abrir = () => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  return (
    <li className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <button
        onClick={() => updateTaskStatus(task.id, feita ? 'para_fazer' : 'feito')}
        className={cn(
          'mt-0.5 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
          feita
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-300 dark:border-slate-500 hover:border-emerald-500 dark:hover:border-emerald-400'
        )}
        aria-label={feita ? 'Reabrir tarefa' : 'Concluir tarefa'}
        title={feita ? 'Reabrir' : 'Concluir'}
      >
        {feita && <Check className="w-3 h-3" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={abrir} className="block w-full text-left">
          <span
            className={cn(
              'text-sm font-medium break-words',
              feita ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
            )}
          >
            {task.title}
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-300">
          {task.type === 'evento' && task.startTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {task.startTime}{task.endTime ? `–${task.endTime}` : ''}
            </span>
          )}
          {prazo && task.type !== 'evento' && (
            <span className={cn('inline-flex items-center gap-1', atrasada && 'text-red-600 dark:text-red-400 font-medium')}>
              <Calendar className="w-3.5 h-3.5" />
              {rotuloDoPrazo(prazo, hoje)}
            </span>
          )}
          {ficouPraTras && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
              <History className="w-3.5 h-3.5" />
              {planejada === diaDe(new Date(Date.now() - 24 * 60 * 60 * 1000))
                ? 'Ficou de ontem'
                : `Ficou de ${planejada.slice(8, 10)}/${planejada.slice(5, 7)}`}
            </span>
          )}
          {area && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
              {area.name}
            </span>
          )}
          {cliente && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {cliente.name}
            </span>
          )}
          {(task.priority === 'urgente' || task.priority === 'alta') && (
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', corPrioridade[task.priority])} />
              {rotuloPrioridade[task.priority]}
            </span>
          )}
          {IconeOrigem && task.source && (
            <span className="inline-flex items-center gap-1" title={task.source === 'cowork' ? 'Criada pelo assistente' : 'De onde a tarefa veio'}>
              <IconeOrigem className="w-3.5 h-3.5" />
              {rotuloOrigem[task.source]}
            </span>
          )}
          {!feita && esperando > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300" title="Depende de outra tarefa que ainda não foi feita">
              <Link2 className="w-3.5 h-3.5" />
              {esperando === 1 ? 'Depende de 1 tarefa' : `Depende de ${esperando} tarefas`}
            </span>
          ) : vinculos.length > 0 && (
            <span className="inline-flex items-center gap-1" title="Tarefas relacionadas">
              <Link2 className="w-3.5 h-3.5" />
              {vinculos.length === 1 ? '1 relacionada' : `${vinculos.length} relacionadas`}
            </span>
          )}
        </div>

        {rodape && <div className="mt-2">{rodape}</div>}
      </div>

      {acoes && <div className="flex items-center gap-1 shrink-0">{acoes}</div>}
    </li>
  );
}
