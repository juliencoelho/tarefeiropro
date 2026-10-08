import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlarmClock, ArrowRight, CalendarClock, CalendarX, Inbox, Mail, Sun } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TaskRow } from '../components/tasks/TaskRow';
import { CampoRapido } from '../components/tasks/CampoRapido';
import { ListaVazia, Secao } from '../components/tasks/Secao';
import { caixaDeEntrada, hojeStr, novaTarefa, organizarHoje } from '../lib/tarefas';
import { useItensMonitorados } from '../hooks/useItensMonitorados';
import { LinhaMonitorada } from '../components/monitoramento/LinhaMonitorada';
import { useEmails } from '../store/useEmails';

function HojePage() {
  const { tasks, currentUser, addTask, updateTask } = useAppStore();
  const hoje = hojeStr();
  const { compromissos, planejadas, concluidas, paraConsiderar } = organizarHoje(tasks, hoje);
  const naCaixa = caixaDeEntrada(tasks).length;
  const paraCobrar = useItensMonitorados().grupos.atencao;
  const emailsAcao = useEmails((s) => s.emails.filter((e) => e.categoria === 'acao' && !e.lido && !e.tarefa_id).length);
  const totalDoDia = planejadas.length + concluidas.length;

  const dataPorExtenso = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hoje</h1>
        <p className="text-slate-600 dark:text-slate-300 first-letter:uppercase">
          {dataPorExtenso}
          {totalDoDia > 0 && ` · ${concluidas.length} de ${totalDoDia} feitas`}
        </p>
      </header>

      {naCaixa > 0 && (
        <Link
          to="/entrada"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-sm text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            {naCaixa === 1 ? '1 item na caixa de entrada para triar' : `${naCaixa} itens na caixa de entrada para triar`}
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
      )}

      {emailsAcao > 0 && (
        <Link
          to="/emails"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {emailsAcao === 1 ? '1 e-mail pedindo ação' : `${emailsAcao} e-mails pedindo ação`}
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
      )}

      {compromissos.length > 0 && (
        <Secao titulo="Compromissos" quantidade={compromissos.length} icone={<CalendarClock className="w-3.5 h-3.5" />}>
          <ul>
            {compromissos.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </Secao>
      )}

      <Secao titulo="Planejado pra hoje" quantidade={planejadas.length} icone={<Sun className="w-3.5 h-3.5" />}>
        <div className="px-3 mb-2">
          <CampoRapido
            placeholder="Adicionar pra hoje…"
            onAdd={(title) => addTask(novaTarefa(title, currentUser, { plannedFor: new Date() }))}
          />
        </div>
        {planejadas.length === 0 ? (
          <ListaVazia>Nada planejado ainda. Puxe algo de "Pra considerar" ou da caixa de entrada.</ListaVazia>
        ) : (
          <ul>
            {planejadas.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                acoes={
                  <button
                    onClick={() => updateTask(task.id, { plannedFor: undefined })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Tirar de hoje"
                    aria-label="Tirar de hoje"
                  >
                    <CalendarX className="w-4 h-4" />
                  </button>
                }
              />
            ))}
          </ul>
        )}
      </Secao>

      {paraCobrar.length > 0 && (
        <Secao titulo="Cobrar hoje" quantidade={paraCobrar.length} icone={<AlarmClock className="w-3.5 h-3.5" />}>
          <ul>
            {paraCobrar.slice(0, 3).map((item) => (
              <LinhaMonitorada key={item.chave} item={item} compacta />
            ))}
          </ul>
          <Link
            to="/monitoramento"
            className="inline-flex items-center gap-1 px-3 mt-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
          >
            {paraCobrar.length > 3 ? `Ver todos os ${paraCobrar.length} no Monitoramento` : 'Abrir Monitoramento'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Secao>
      )}

      {paraConsiderar.length > 0 && (
        <Secao titulo="Pra considerar" quantidade={paraConsiderar.length}>
          <p className="px-3 mb-1 text-xs text-slate-500 dark:text-slate-300">
            Vence hoje, está atrasada ou ficou de um dia anterior.
          </p>
          <ul>
            {paraConsiderar.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                acoes={
                  <button
                    onClick={() => updateTask(task.id, { plannedFor: new Date() })}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    title="Puxar pra hoje"
                  >
                    <Sun className="w-4 h-4" />
                    <span className="hidden sm:inline">Pra hoje</span>
                  </button>
                }
              />
            ))}
          </ul>
        </Secao>
      )}

      {concluidas.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100">
            Concluídas hoje <span className="font-normal normal-case tracking-normal">{concluidas.length}</span>
          </summary>
          <ul className="mt-1">
            {concluidas.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default HojePage;
