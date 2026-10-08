import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Hourglass, Inbox, ListPlus, Loader2, Paperclip, Plug, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { CategoriaEmail, Email, useEmails } from '../store/useEmails';
import { ListaVazia, Secao } from '../components/tasks/Secao';
import { novaTarefa } from '../lib/tarefas';
import { cn } from '../lib/utils';

const rotuloCategoria: Record<CategoriaEmail, string> = {
  acao: 'Ação',
  informativo: 'Informativo',
  descartavel: 'Descartável',
};

function quando(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const botao =
  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors';

function LinhaEmail({ email }: { email: Email }) {
  const { currentUser, addTask, addMonitoringItem, tasks } = useAppStore();
  const { mudarCategoria, marcarTarefa, criarRegraRemetente, lerCorpo } = useEmails();
  const [aberto, setAberto] = useState(false);
  const [corpo, setCorpo] = useState<string | null>(null);
  const [mudando, setMudando] = useState(false);

  const remetente = email.de_nome || email.de_endereco || 'Remetente desconhecido';
  const descricao = [
    `E-mail de ${email.de_nome ?? ''} <${email.de_endereco ?? ''}>`,
    email.link_web ? `Abrir no Outlook: ${email.link_web}` : '',
    '',
    email.previa ?? '',
  ].join('\n');

  const abrir = async () => {
    setAberto(!aberto);
    if (!aberto && corpo === null) setCorpo(await lerCorpo(email.id));
  };

  const virarTarefa = () => {
    const antes = new Set(tasks.map((t) => t.id));
    addTask(novaTarefa(email.assunto || '(sem assunto)', currentUser, { inInbox: true, description: descricao }));
    const nova = useAppStore.getState().tasks.find((t) => !antes.has(t.id));
    if (nova) marcarTarefa(email.id, nova.id);
    toast.success('Virou tarefa na caixa de entrada');
  };

  const aguardar = () => {
    addMonitoringItem({
      origem: 'manual',
      kind: 'aguardando_retorno',
      title: `Retorno: ${email.assunto || remetente}`,
      notes: email.link_web ?? undefined,
      status: 'aberto',
      followUpOn: new Date(new Date().setHours(0, 0, 0, 0) + 3 * 24 * 60 * 60 * 1000),
    });
    toast.success('Vai aparecer pra cobrar em 3 dias');
  };

  const mudar = (categoria: CategoriaEmail) => {
    mudarCategoria(email.id, categoria);
    setMudando(false);
    if (email.de_endereco) {
      toast(`Movido para ${rotuloCategoria[categoria]}`, {
        action: { label: 'Sempre deste remetente', onClick: () => criarRegraRemetente(email.de_endereco!, categoria) },
      });
    }
  };

  return (
    <li className="px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <button onClick={abrir} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <p className={cn('text-sm break-words', email.lido ? 'text-slate-700 dark:text-slate-200' : 'font-semibold text-slate-900 dark:text-white')}>
            {!email.lido && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1.5 align-middle" />}
            {remetente}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-300 shrink-0">{quando(email.recebido_em)}</span>
        </div>
        <p className="text-sm text-slate-900 dark:text-slate-100 break-words">{email.assunto || '(sem assunto)'}</p>
        {!aberto && <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-1">{email.previa}</p>}
      </button>

      {aberto && (
        <div className="mt-2 space-y-2">
          {email.anexos.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-300 inline-flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              {email.anexos.map((a) => a.nome).join(', ')}
            </p>
          )}
          {/* Texto puro: conteúdo de fora nunca é renderizado como HTML */}
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700 dark:text-slate-200 max-h-80 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
            {corpo === null ? 'Carregando…' : corpo || email.previa}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 mt-1.5 -ml-2 text-xs">
        {email.tarefa_id ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 dark:text-emerald-300">
            <ListPlus className="w-3.5 h-3.5" /> Virou tarefa
          </span>
        ) : (
          <button onClick={virarTarefa} className={botao}>
            <ListPlus className="w-3.5 h-3.5" /> Virar tarefa
          </button>
        )}
        <button onClick={aguardar} className={botao}>
          <Hourglass className="w-3.5 h-3.5" /> Aguardar retorno
        </button>
        {email.link_web && (
          <a href={email.link_web} target="_blank" rel="noopener noreferrer" className={botao}>
            <ExternalLink className="w-3.5 h-3.5" /> Abrir no Outlook
          </a>
        )}
        <button onClick={() => setMudando(!mudando)} className={botao}>
          {email.categoria ? rotuloCategoria[email.categoria] : 'Classificar'}
        </button>
        {email.motivo_categoria && !mudando && (
          <span className="text-slate-400 dark:text-slate-400">· {email.motivo_categoria}</span>
        )}
      </div>

      {mudando && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {(Object.keys(rotuloCategoria) as CategoriaEmail[]).map((c) => (
            <button
              key={c}
              onClick={() => mudar(c)}
              className={cn(
                'px-2.5 py-1 rounded-full border text-xs font-medium',
                c === email.categoria
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {rotuloCategoria[c]}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

function EmailsPage() {
  const { contas, emails, carregado, atualizando, atualizarAgora } = useEmails();
  const ativas = contas.filter((c) => c.ativa);
  const porCategoria = (c: CategoriaEmail) => emails.filter((e) => e.categoria === c);
  const acao = porCategoria('acao');
  const informativo = porCategoria('informativo');
  const descartavel = porCategoria('descartavel');
  const ultimaLeitura = ativas
    .map((c) => c.ultimo_sync_em)
    .filter((d): d is string => !!d)
    .sort()[0];
  const comErro = ativas.find((c) => c.ultimo_erro);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E-mails</h1>
          <p className="text-slate-600 dark:text-slate-300">
            {ativas.length ? ativas.map((c) => c.endereco).join(', ') : 'Nenhuma caixa conectada'}
            {ultimaLeitura && (
              <span className="text-xs ml-1">
                · lido às {new Date(ultimaLeitura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        {ativas.length > 0 && (
          <button
            onClick={() => atualizarAgora()}
            disabled={atualizando}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            title="Atualizar agora"
            aria-label="Atualizar agora"
          >
            <RefreshCw className={cn('w-4 h-4', atualizando && 'animate-spin')} />
          </button>
        )}
      </header>

      {carregado && ativas.length === 0 && (
        <Link
          to="/configuracoes?aba=sistemas"
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-sm text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/70"
        >
          <Plug className="w-4 h-4 shrink-0" />
          Conecte o seu Hotmail em Configurações → Sistemas.
        </Link>
      )}
      {comErro && (
        <div className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-800 dark:text-red-200">
          Não consegui ler {comErro.endereco}: {comErro.ultimo_erro}
        </div>
      )}

      {!carregado ? (
        <ListaVazia>
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Carregando…
        </ListaVazia>
      ) : emails.length === 0 && ativas.length > 0 ? (
        <ListaVazia>Nenhum e-mail nos últimos 30 dias. Se acabou de conectar, a primeira leitura leva alguns minutos.</ListaVazia>
      ) : (
        <div className="space-y-6 -mx-3">
          <Secao titulo="Precisa de ação" quantidade={acao.length} icone={<Inbox className="w-3.5 h-3.5" />}>
            {acao.length === 0 ? <ListaVazia>Nada pedindo ação.</ListaVazia> : (
              <ul>{acao.map((e) => <LinhaEmail key={e.id} email={e} />)}</ul>
            )}
          </Secao>
          {informativo.length > 0 && (
            <Secao titulo="Informativo" quantidade={informativo.length}>
              <ul>{informativo.map((e) => <LinhaEmail key={e.id} email={e} />)}</ul>
            </Secao>
          )}
          {descartavel.length > 0 && (
            <details>
              <summary className="cursor-pointer list-none px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100">
                Descartável <span className="font-normal normal-case tracking-normal">{descartavel.length}</span>
              </summary>
              <ul className="mt-1">{descartavel.map((e) => <LinhaEmail key={e.id} email={e} />)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default EmailsPage;
