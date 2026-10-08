import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Mail, Pause, Play, Plug, RefreshCw, Unplug } from 'lucide-react';
import { useEmails } from '../../store/useEmails';
import { useMonitoramento } from '../../store/useMonitoramento';
import { configSistemas, listaSistemas } from '../../lib/sistemas';
import { Sistema } from '../../types';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

function CartaoSistema({ sistema }: { sistema: Sistema }) {
  const { sistemas, conectar, desconectar } = useMonitoramento();
  const estado = sistemas[sistema];
  const { nome } = configSistemas[sistema];

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleConectar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const falha = await conectar(sistema, email, senha);
    setEnviando(false);
    if (falha) setErro(falha);
    else setSenha('');
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">{nome}</h3>
        {estado.email ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Conectado
          </span>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-300">Não conectado</span>
        )}
      </div>

      {estado.email ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Entrando como <strong className="font-medium text-slate-900 dark:text-white">{estado.email}</strong>.
            {estado.atualizadoEm && ` ${estado.itens.length} itens em acompanhamento.`}
          </p>
          {estado.erro && <p className="text-sm text-red-600 dark:text-red-400">Erro ao ler: {estado.erro}</p>}
          <button
            onClick={() => desconectar(sistema)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Unplug className="w-4 h-4" /> Desconectar neste aparelho
          </button>
        </div>
      ) : (
        <form onSubmit={handleConectar} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`E-mail do ${nome}`}
              className={inputClass}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              className={inputClass}
            />
          </div>
          {(erro || estado.erro) && <p className="text-sm text-red-600 dark:text-red-400">{erro ?? estado.erro}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            Conectar {nome}
          </button>
        </form>
      )}
    </div>
  );
}

// Hotmail pessoal: lido pelo robô no servidor (Microsoft Graph), sem senha guardada
function CartaoEmail() {
  const { contas, carregado, atualizando, conectar, atualizarAgora, pausar } = useEmails();
  const [conectando, setConectando] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Volta do login da Microsoft: avisa o resultado e limpa o endereço
  useEffect(() => {
    const resultado = searchParams.get('email');
    if (!resultado) return;
    if (resultado === 'conectado') toast.success('Hotmail conectado. A primeira leitura leva alguns minutos.');
    else toast.error(`Não consegui conectar: ${searchParams.get('motivo') ?? 'erro desconhecido'}`);
    searchParams.delete('email');
    searchParams.delete('motivo');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Mail className="w-4 h-4" /> E-mail pessoal (Hotmail)
        </h3>
        {contas.some((c) => c.ativa) ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Conectado
          </span>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-300">Não conectado</span>
        )}
      </div>

      {contas.map((conta) => (
        <div key={conta.id} className="space-y-2 mb-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong className="font-medium text-slate-900 dark:text-white">{conta.endereco}</strong>
            {conta.ativa ? '' : ' · pausado'}
            {conta.ultimo_sync_em && (
              <> · lido às {new Date(conta.ultimo_sync_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </p>
          {conta.ultimo_erro && <p className="text-sm text-red-600 dark:text-red-400">Erro na última leitura: {conta.ultimo_erro}</p>}
          <div className="flex flex-wrap gap-2">
            {conta.ativa && (
              <button
                onClick={() => atualizarAgora()}
                disabled={atualizando}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} /> Atualizar agora
              </button>
            )}
            <button
              onClick={() => pausar(conta.id, !conta.ativa)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {conta.ativa ? <><Pause className="w-4 h-4" /> Pausar leitura</> : <><Play className="w-4 h-4" /> Retomar leitura</>}
            </button>
          </div>
        </div>
      ))}

      {carregado && contas.length === 0 && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Você entra na página da Microsoft e autoriza o Tarefeiro a ler e organizar os seus e-mails. Nenhuma senha fica guardada;
          dá para revogar quando quiser em account.microsoft.com.
        </p>
      )}

      {contas.length === 0 && (
        <button
          onClick={async () => {
            setConectando(true);
            await conectar();
            setConectando(false);
          }}
          disabled={conectando}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium"
        >
          {conectando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
          Conectar Hotmail
        </button>
      )}
    </div>
  );
}

export function SistemasConectados() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sistemas conectados</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          O Tarefeiro entra em cada sistema com o seu usuário e enxerga só o que você já enxerga lá.
          A senha não fica guardada: fica só a sessão, neste aparelho.
        </p>
      </div>
      {listaSistemas.map((sistema) => (
        <CartaoSistema key={sistema} sistema={sistema} />
      ))}
      <CartaoEmail />
    </div>
  );
}
