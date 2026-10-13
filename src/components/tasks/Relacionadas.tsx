import { useMemo, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Circle, Hourglass, Link2, Lock, Plus, Search, X } from 'lucide-react';
import { Task } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { novaTarefa, Vinculo, vinculosDe } from '../../lib/tarefas';

// Como o usuário escolhe o vínculo, do ponto de vista da tarefa aberta
type Escolha = 'complementa' | 'esta_depende' | 'outra_depende';

const opcoes: { valor: Escolha; rotulo: string }[] = [
  { valor: 'complementa', rotulo: 'Se complementam' },
  { valor: 'esta_depende', rotulo: 'Esta depende dela' },
  { valor: 'outra_depende', rotulo: 'Ela depende desta' },
];

const rotuloSentido: Record<Vinculo['sentido'], { texto: string; icone: typeof Link2 }> = {
  depende: { texto: 'Esta depende de', icone: Hourglass },
  complementa: { texto: 'Complementa', icone: ArrowLeftRight },
  bloqueia: { texto: 'Depende desta', icone: Lock },
};

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function Relacionadas({ task }: { task: Task }) {
  const { tasks, taskLinks, currentUser, addTask, relacionarTarefas, desfazerRelacao, setSelectedTask } = useAppStore();
  const [adicionando, setAdicionando] = useState(false);
  const [busca, setBusca] = useState('');
  const [escolha, setEscolha] = useState<Escolha>('complementa');

  const vinculos = vinculosDe(task.id, taskLinks, tasks);
  const jaLigadas = new Set(vinculos.map((v) => v.outra.id));

  const resultados = useMemo(() => {
    const termo = semAcento(busca.trim());
    return tasks
      .filter((t) => t.id !== task.id && !jaLigadas.has(t.id) && t.status !== 'feito')
      .filter((t) => !termo || semAcento(`${t.title} ${t.description}`).includes(termo))
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, tasks, task.id, taskLinks]);

  const ligar = (outraId: string) => {
    if (escolha === 'complementa') relacionarTarefas(task.id, outraId, 'complementa');
    else if (escolha === 'esta_depende') relacionarTarefas(task.id, outraId, 'depende_de');
    else relacionarTarefas(outraId, task.id, 'depende_de');
    setBusca('');
    setAdicionando(false);
  };

  // Tarefa nova já ligada a esta, na mesma área
  const criarELigar = () => {
    const titulo = busca.trim();
    if (!titulo) return;
    const id = addTask(novaTarefa(titulo, currentUser, { areaId: task.areaId, inInbox: !task.areaId }));
    ligar(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="inline-flex items-center gap-2 font-medium text-slate-900 dark:text-white">
          <Link2 className="w-4 h-4" /> Tarefas relacionadas
        </h4>
        {!adicionando && (
          <button
            onClick={() => setAdicionando(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Plus className="w-4 h-4" /> Relacionar
          </button>
        )}
      </div>

      {vinculos.length === 0 && !adicionando && (
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Ligue esta tarefa a outras que se complementam ou que precisam ser feitas antes.
        </p>
      )}

      <ul className="space-y-1">
        {vinculos.map(({ link, outra, sentido }) => {
          const { texto, icone: Icone } = rotuloSentido[sentido];
          const feita = outra.status === 'feito';
          const travando = sentido === 'depende' && !feita;
          return (
            <li key={link.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 group">
              {feita
                ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                : <Circle className="w-4 h-4 shrink-0 text-slate-400" />}
              <span
                className={cn(
                  'inline-flex items-center gap-1 shrink-0 text-xs font-medium',
                  travando ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-300'
                )}
              >
                <Icone className="w-3.5 h-3.5" /> {texto}
              </span>
              <button
                onClick={() => setSelectedTask(outra)}
                className={cn(
                  'flex-1 min-w-0 text-left text-sm truncate hover:underline',
                  feita ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                )}
                title="Abrir esta tarefa"
              >
                {outra.title}
              </button>
              <button
                onClick={() => desfazerRelacao(link.id)}
                className="shrink-0 p-1 rounded opacity-60 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20"
                title="Desfazer a relação (as tarefas continuam existindo)"
                aria-label="Desfazer a relação"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </li>
          );
        })}
      </ul>

      {adicionando && (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
          <div className="flex flex-wrap gap-1">
            {opcoes.map((o) => (
              <button
                key={o.valor}
                onClick={() => setEscolha(o.valor)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  escolha === o.valor
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
              >
                {o.rotulo}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAdicionando(false);
                if (e.key === 'Enter' && resultados.length === 0) criarELigar();
              }}
              placeholder="Procure a tarefa pelo nome..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {resultados.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => ligar(t.id)}
                  className="w-full text-left px-2 py-1.5 rounded-md text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 truncate"
                >
                  {t.title}
                </button>
              </li>
            ))}
            {busca.trim() && (
              <li>
                <button
                  onClick={criarELigar}
                  className="w-full text-left px-2 py-1.5 rounded-md text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 truncate"
                >
                  <Plus className="inline w-4 h-4 mr-1" />
                  Criar "{busca.trim()}" e relacionar
                </button>
              </li>
            )}
          </ul>
          <div className="flex justify-end">
            <button
              onClick={() => { setAdicionando(false); setBusca(''); }}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
