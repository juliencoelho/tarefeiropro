import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive, Check, Pencil, Sun, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { TaskRow } from '../components/tasks/TaskRow';
import { CampoRapido } from '../components/tasks/CampoRapido';
import { ListaVazia, Secao } from '../components/tasks/Secao';
import { coresDeArea, diaDe, hojeStr, novaTarefa, organizarArea } from '../lib/tarefas';
import { cn } from '../lib/utils';

// A chave por área reinicia o estado (ex.: edição aberta) ao trocar de área no menu
function AreaPage() {
  const { id } = useParams();
  return <AreaConteudo key={id} id={id ?? ''} />;
}

function AreaConteudo({ id }: { id: string }) {
  const navigate = useNavigate();
  const { areas, tasks, currentUser, addTask, updateTask, updateArea } = useAppStore();
  const area = areas.find((a) => a.id === id);

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('');

  if (!area || area.archived) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-slate-600 dark:text-slate-300">
        Área não encontrada. <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">Voltar para Hoje</Link>
      </div>
    );
  }

  const hoje = hojeStr();
  const grupos = organizarArea(tasks, area.id, hoje);
  const total = grupos.hoje.length + grupos.comPrazo.length + grupos.semPrazo.length;

  const comecarEdicao = () => {
    setNome(area.name);
    setCor(area.color);
    setEditando(true);
  };

  const salvarEdicao = () => {
    if (!nome.trim()) return;
    updateArea(area.id, { name: nome.trim(), color: cor });
    setEditando(false);
  };

  const arquivar = () => {
    if (!window.confirm(`Arquivar a área "${area.name}"? As tarefas continuam salvas, só a área some do menu.`)) return;
    updateArea(area.id, { archived: true });
    toast(`Área "${area.name}" arquivada`);
    navigate('/');
  };

  const botaoPraHoje = (taskId: string) => (
    <button
      onClick={() => updateTask(taskId, { plannedFor: new Date() })}
      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      title="Puxar pra hoje"
      aria-label="Puxar pra hoje"
    >
      <Sun className="w-4 h-4" />
    </button>
  );

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <header>
        {editando ? (
          <div className="space-y-3">
            <input
              value={nome}
              autoFocus
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') salvarEdicao();
                if (e.key === 'Escape') setEditando(false);
              }}
              className="w-full text-2xl font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap items-center gap-2">
              {coresDeArea.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  className={cn('w-7 h-7 rounded-full border-2', cor === c ? 'border-slate-900 dark:border-white' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setEditando(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900 dark:text-white">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: area.color }} />
                {area.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                {total === 0 ? 'Nenhuma pendência' : total === 1 ? '1 pendência' : `${total} pendências`}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={comecarEdicao}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Renomear ou trocar a cor"
                aria-label="Editar área"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={arquivar}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Arquivar área"
                aria-label="Arquivar área"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <CampoRapido
        placeholder={`Adicionar em ${area.name}…`}
        onAdd={(title) => addTask(novaTarefa(title, currentUser, { areaId: area.id }))}
      />

      {total === 0 ? (
        <ListaVazia>Nada pendente nesta área.</ListaVazia>
      ) : (
        <>
          {grupos.hoje.length > 0 && (
            <Secao titulo="Hoje" quantidade={grupos.hoje.length}>
              <ul>
                {grupos.hoje.map((task) => (
                  <TaskRow key={task.id} task={task} mostrarArea={false} />
                ))}
              </ul>
            </Secao>
          )}
          {grupos.comPrazo.length > 0 && (
            <Secao titulo="Com prazo" quantidade={grupos.comPrazo.length}>
              <ul>
                {grupos.comPrazo.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    mostrarArea={false}
                    acoes={diaDe(task.plannedFor) !== hoje ? botaoPraHoje(task.id) : undefined}
                  />
                ))}
              </ul>
            </Secao>
          )}
          {grupos.semPrazo.length > 0 && (
            <Secao titulo="Sem prazo" quantidade={grupos.semPrazo.length}>
              <ul>
                {grupos.semPrazo.map((task) => (
                  <TaskRow key={task.id} task={task} mostrarArea={false} acoes={botaoPraHoje(task.id)} />
                ))}
              </ul>
            </Secao>
          )}
        </>
      )}
    </div>
  );
}

export default AreaPage;
