import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlarmClock, ArrowRight, CalendarClock, CalendarX, Inbox, Mail, Sun, Unplug } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TaskRow } from '../components/tasks/TaskRow';
import { CampoRapido } from '../components/tasks/CampoRapido';
import { ListaVazia, Secao } from '../components/tasks/Secao';
import { caixaDeEntrada, diaDe, hojeStr, novaTarefa, organizarHoje } from '../lib/tarefas';
import { DIAS_COBRAR_HOJE, ItemMonitorado, rotuloSecao, SecaoMonitorada, secaoDe } from '../lib/monitoramento';
import { Task, TaskPriority } from '../types';
import { useItensMonitorados } from '../hooks/useItensMonitorados';
import { LinhaMonitorada } from '../components/monitoramento/LinhaMonitorada';
import { pendentesDeAcao, useEmails } from '../store/useEmails';
import { useMonitoramento } from '../store/useMonitoramento';
import { configSistemas, listaSistemas } from '../lib/sistemas';
import { cn } from '../lib/utils';

// "Pra considerar" mostra só as 5 mais importantes; o resto fica recolhido
const LIMITE_CONSIDERAR = 5;
// Cada grupo de "Cobrar hoje" mostra até 5 linhas; o resto está no Monitoramento
const LIMITE_POR_GRUPO = 5;

const pesoPrioridade: Record<TaskPriority, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };

// Dias entre dois 'yyyy-MM-dd' (sem fuso: os dois são meia-noite local)
function diasEntre(de: string, ate: string): number {
  const [a1, m1, d1] = de.split('-').map(Number);
  const [a2, m2, d2] = ate.split('-').map(Number);
  return Math.round((new Date(a2, m2 - 1, d2).getTime() - new Date(a1, m1 - 1, d1).getTime()) / 86_400_000);
}

// Há quantos dias a tarefa está rolando: desde o prazo vencido ou o dia em que ficou planejada
function diasRolando(t: Task, hoje: string): number {
  const marcos = [diaDe(t.dueDate), diaDe(t.plannedFor)].filter((d) => d !== '' && d < hoje).sort();
  return marcos.length ? diasEntre(marcos[0], hoje) : 0;
}

// Prioridade, depois prazo (sem prazo no fim), depois quem está rolando há mais tempo
function ordenarParaConsiderar(tarefas: Task[], hoje: string): Task[] {
  return [...tarefas].sort(
    (a, b) =>
      pesoPrioridade[a.priority] - pesoPrioridade[b.priority] ||
      (diaDe(a.dueDate) || '9999-99-99').localeCompare(diaDe(b.dueDate) || '9999-99-99') ||
      diasRolando(b, hoje) - diasRolando(a, hoje)
  );
}

const gruposCobrar: { id: SecaoMonitorada; titulo: string }[] = [
  { id: 'hospicare', titulo: 'Hospicare — a receber da Hospicare, NFs e empenhos' },
  { id: 'fernandes', titulo: 'Cirúrgica Fernandes — títulos da Fernandes (base da comissão)' },
  { id: 'retorno', titulo: rotuloSecao.retorno.nome },
];

function HojePage() {
  const { tasks, currentUser, addTask, updateTask } = useAppStore();
  const hoje = hojeStr();
  const { compromissos, planejadas, concluidas, paraConsiderar: considerarTodas } = organizarHoje(tasks, hoje);
  const paraConsiderar = ordenarParaConsiderar(considerarTodas, hoje);
  const naCaixa = caixaDeEntrada(tasks).length;
  const { agora: paraCobrar, antigos: cobrancasAntigas } = useItensMonitorados().cobrar;
  const daSecao = (lista: ItemMonitorado[], secao: SecaoMonitorada) => lista.filter((i) => secaoDe(i) === secao);
  const antigasHospicare = daSecao(cobrancasAntigas, 'hospicare').length;
  const antigasFernandes = daSecao(cobrancasAntigas, 'fernandes').length;
  const emailsAcao = useEmails((s) => pendentesDeAcao(s.emails).length);
  const totalDoDia = planejadas.length + concluidas.length;
  // BasePro e Nexo fazem logout de todo mundo uma vez por dia; aqui o usuário percebe e reconecta
  const { sistemas, verificado } = useMonitoramento();
  const desconectados = verificado
    ? listaSistemas.filter((s) => configSistemas[s].url && !sistemas[s].email).map((s) => configSistemas[s].nome)
    : [];

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

      {desconectados.length > 0 && (
        <Link
          to="/configuracoes?aba=sistemas"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-sm text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/70 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Unplug className="w-4 h-4 shrink-0" />
            {desconectados.join(' e ')} {desconectados.length === 1 ? 'desconectado' : 'desconectados'}: as tarefas e o monitoramento de lá pararam de chegar.
          </span>
          <span className="inline-flex items-center gap-1 shrink-0 font-medium">
            Reconectar <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}

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

      {(paraCobrar.length > 0 || cobrancasAntigas.length > 0) && (
        <Secao titulo="Cobrar hoje" quantidade={paraCobrar.length} icone={<AlarmClock className="w-3.5 h-3.5" />}>
          <p className="px-3 mb-1 text-xs text-slate-500 dark:text-slate-300">
            Marcados para cobrar até hoje e o que venceu nos últimos {DIAS_COBRAR_HOJE} dias. Cada empresa no seu grupo: os valores não se somam.
          </p>
          <div className="space-y-3">
            {gruposCobrar.map((g) => {
              const itens = daSecao(paraCobrar, g.id);
              if (itens.length === 0) return null;
              return (
                <div key={g.id}>
                  <h3 className="px-3 text-xs font-medium text-slate-700 dark:text-slate-200">
                    {g.titulo} <span className="font-normal text-slate-400 dark:text-slate-400">{itens.length}</span>
                  </h3>
                  <ul>
                    {itens.slice(0, LIMITE_POR_GRUPO).map((item) => (
                      <LinhaMonitorada key={item.chave} item={item} compacta />
                    ))}
                  </ul>
                  {itens.length > LIMITE_POR_GRUPO && (
                    <Link
                      to={`/monitoramento?secao=${g.id}`}
                      className="inline-flex items-center gap-1 px-3 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                    >
                      Mais {itens.length - LIMITE_POR_GRUPO} no Monitoramento <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          {cobrancasAntigas.length > 0 && (
            <Link
              to={`/monitoramento?secao=${antigasHospicare >= antigasFernandes ? 'hospicare' : 'fernandes'}`}
              className="flex items-center justify-between gap-3 mx-3 mt-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>
                Atrasados há mais de {DIAS_COBRAR_HOJE} dias: {cobrancasAntigas.length}
                {antigasHospicare > 0 && antigasFernandes > 0 && ` (Hospicare ${antigasHospicare} · CF ${antigasFernandes})`}
              </span>
              <span className="inline-flex items-center gap-1 shrink-0 font-medium text-blue-700 dark:text-blue-300">
                Ver no Monitoramento <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}
        </Secao>
      )}

      {paraConsiderar.length > 0 && (
        <Secao titulo="Pra considerar" quantidade={paraConsiderar.length}>
          <p className="px-3 mb-1 text-xs text-slate-500 dark:text-slate-300">
            Vence hoje, está atrasada ou ficou de um dia anterior. As {Math.min(LIMITE_CONSIDERAR, paraConsiderar.length)} mais importantes primeiro.
          </p>
          <ul>
            {paraConsiderar.slice(0, LIMITE_CONSIDERAR).map((task) => (
              <LinhaConsiderar key={task.id} task={task} hoje={hoje} onPuxar={() => updateTask(task.id, { plannedFor: new Date() })} />
            ))}
          </ul>
          {paraConsiderar.length > LIMITE_CONSIDERAR && (
            <details className="group mt-1">
              <summary className="cursor-pointer list-none px-3 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline">
                <span className="group-open:hidden">Ver mais {paraConsiderar.length - LIMITE_CONSIDERAR}</span>
                <span className="hidden group-open:inline">Mostrar menos</span>
              </summary>
              <ul className="mt-1">
                {paraConsiderar.slice(LIMITE_CONSIDERAR).map((task) => (
                  <LinhaConsiderar key={task.id} task={task} hoje={hoje} onPuxar={() => updateTask(task.id, { plannedFor: new Date() })} />
                ))}
              </ul>
            </details>
          )}
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

function LinhaConsiderar({ task, hoje, onPuxar }: { task: Task; hoje: string; onPuxar: () => void }) {
  const dias = diasRolando(task, hoje);
  return (
    <TaskRow
      task={task}
      acoes={
        <>
          {dias > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[11px] font-medium tabular-nums',
                dias >= 14
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              )}
              title="Há quantos dias está rolando sem ser feita"
            >
              {dias === 1 ? 'há 1 dia' : `há ${dias} dias`}
            </span>
          )}
          <button
            onClick={onPuxar}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            title="Puxar pra hoje"
          >
            <Sun className="w-4 h-4" />
            <span className="hidden sm:inline">Pra hoje</span>
          </button>
        </>
      }
    />
  );
}

export default HojePage;
