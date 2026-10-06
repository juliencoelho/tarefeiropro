import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, AlarmClock, Plug, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useMonitoramento } from '../store/useMonitoramento';
import { useItensMonitorados } from '../hooks/useItensMonitorados';
import { LinhaMonitorada } from '../components/monitoramento/LinhaMonitorada';
import { CampoRapido } from '../components/tasks/CampoRapido';
import { ListaVazia, Secao } from '../components/tasks/Secao';
import { agrupar, brl, ItemMonitorado, totais } from '../lib/monitoramento';
import { configSistemas, listaSistemas } from '../lib/sistemas';
import { hojeStr } from '../lib/tarefas';
import { Sistema, TipoMonitorado } from '../types';
import { cn } from '../lib/utils';

type FiltroTipo = 'todos' | TipoMonitorado;
type FiltroOrigem = 'todas' | Sistema | 'manual';

const filtrosTipo: { id: FiltroTipo; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Tudo' },
  { id: 'conta_receber', rotulo: 'A receber' },
  { id: 'empenho', rotulo: 'Empenhos' },
  { id: 'nf_transito', rotulo: 'NFs' },
  { id: 'aguardando_retorno', rotulo: 'Aguardando retorno' },
];

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <div className="shrink-0 min-w-[10.5rem] lg:min-w-0 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3">
      <p className="text-xs text-slate-500 dark:text-slate-300">{titulo}</p>
      <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">{valor}</p>
      <p className="text-xs text-slate-500 dark:text-slate-300">{detalhe}</p>
    </div>
  );
}

function Lista({ itens }: { itens: ItemMonitorado[] }) {
  return (
    <ul>
      {itens.map((item) => (
        <LinhaMonitorada key={item.chave} item={item} />
      ))}
    </ul>
  );
}

function MonitoramentoPage() {
  const { addMonitoringItem } = useAppStore();
  const { sistemas, carregando, carregar } = useMonitoramento();
  const { ativos, dispensados } = useItensMonitorados();
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [origem, setOrigem] = useState<FiltroOrigem>('todas');

  const filtrados = ativos.filter(
    (i) => (tipo === 'todos' || i.tipo === tipo) && (origem === 'todas' || i.origem === origem)
  );
  const grupos = agrupar(filtrados, hojeStr());
  const soma = totais(ativos);
  const desconectados = listaSistemas.filter((s) => !sistemas[s].email && !sistemas[s].erro);
  const comErro = listaSistemas.filter((s) => sistemas[s].erro);
  // O mais antigo entre os sistemas conectados: é o quão atual a tela está
  const atualizadoEm = listaSistemas
    .map((s) => sistemas[s].atualizadoEm)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const chipFiltro = (ativo: boolean) =>
    cn(
      'shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
      ativo
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
    );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Monitoramento</h1>
          <p className="text-slate-600 dark:text-slate-300">
            O que depende dos outros, mas você precisa acompanhar.
            {atualizadoEm && (
              <span className="text-xs ml-1">
                Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => carregar()}
          disabled={carregando}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          title="Atualizar agora"
          aria-label="Atualizar agora"
        >
          <RefreshCw className={cn('w-4 h-4', carregando && 'animate-spin')} />
        </button>
      </header>

      {desconectados.length > 0 && (
        <Link
          to="/configuracoes?aba=sistemas"
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-sm text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-950/70"
        >
          <Plug className="w-4 h-4 shrink-0" />
          Conecte {desconectados.map((s) => configSistemas[s].nome).join(' e ')} para ver NFs, contas a receber e empenhos.
        </Link>
      )}
      {comErro.map((s) => (
        <div
          key={s}
          className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-800 dark:text-red-200"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Não consegui ler o {configSistemas[s].nome}: {sistemas[s].erro}</span>
        </div>
      ))}

      <div className="flex gap-3 overflow-x-auto sem-barra pb-1 -mx-4 px-4 md:mx-0 md:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible">
        <Cartao titulo="A receber · Nexo" valor={brl.format(soma.receberNexo.valor)} detalhe={plural(soma.receberNexo.qtd, 'parcela em aberto', 'parcelas em aberto')} />
        <Cartao titulo="Títulos em aberto · BasePro" valor={brl.format(soma.titulosBasePro.valor)} detalhe={`${plural(soma.titulosBasePro.qtd, 'parcela', 'parcelas')} · clientes → representada`} />
        <Cartao titulo="Valor empenhado em aberto" valor={brl.format(soma.empenhos.valor)} detalhe={plural(soma.empenhos.qtd, 'empenho', 'empenhos')} />
        <Cartao titulo="NFs a entregar" valor={String(soma.nfs.qtd)} detalhe={brl.format(soma.nfs.valor)} />
        <Cartao titulo="Aguardando retorno" valor={String(soma.retorno.qtd)} detalhe="pessoas e respostas" />
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto sem-barra pb-1 md:flex-wrap md:overflow-visible">
          {filtrosTipo.map((f) => (
            <button key={f.id} onClick={() => setTipo(f.id)} className={chipFiltro(tipo === f.id)}>
              {f.rotulo}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto sem-barra pb-1 md:flex-wrap md:overflow-visible">
          {(['todas', ...listaSistemas, 'manual'] as FiltroOrigem[]).map((o) => (
            <button key={o} onClick={() => setOrigem(o)} className={chipFiltro(origem === o)}>
              {o === 'todas' ? 'Todas as origens' : o === 'manual' ? 'Manual' : configSistemas[o].nome}
            </button>
          ))}
        </div>
      </div>

      {(tipo === 'todos' || tipo === 'aguardando_retorno') && (
        <CampoRapido
          placeholder="Aguardando retorno de quem?"
          onAdd={(title) =>
            addMonitoringItem({
              origem: 'manual',
              kind: 'aguardando_retorno',
              title,
              status: 'aberto',
              followUpOn: new Date(new Date().setHours(0, 0, 0, 0) + 2 * 24 * 60 * 60 * 1000),
            })
          }
        />
      )}

      {filtrados.length === 0 ? (
        <ListaVazia>
          {carregando ? 'Carregando…' : 'Nada em aberto por aqui.'}
        </ListaVazia>
      ) : (
        <div className="space-y-6 -mx-3">
          {grupos.atencao.length > 0 && (
            <Secao titulo="Cobrar hoje ou atrasado" quantidade={grupos.atencao.length} icone={<AlarmClock className="w-3.5 h-3.5" />}>
              <Lista itens={grupos.atencao} />
            </Secao>
          )}
          {grupos.semana.length > 0 && (
            <Secao titulo="Próximos 7 dias" quantidade={grupos.semana.length}>
              <Lista itens={grupos.semana} />
            </Secao>
          )}
          {grupos.depois.length > 0 && (
            <Secao titulo="Depois ou sem data" quantidade={grupos.depois.length}>
              <Lista itens={grupos.depois} />
            </Secao>
          )}
        </div>
      )}

      {dispensados.length > 0 && (
        <details className="-mx-3">
          <summary className="cursor-pointer list-none px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100">
            Dispensados <span className="font-normal normal-case tracking-normal">{dispensados.length}</span>
          </summary>
          <p className="px-3 mt-1 text-xs text-slate-500 dark:text-slate-300">
            Continuam em aberto no sistema, só não aparecem na lista. Use "Restaurar" para trazer de volta.
          </p>
          <Lista itens={dispensados} />
        </details>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-300">
        Os totais não se somam entre si. A receber do Nexo é o saldo que os clientes devem à empresa; títulos do BasePro
        são o que os clientes devem à representada (a comissão sai do que for pago); empenho é o valor empenhado ainda
        não recebido; NFs é o valor das notas ainda não entregues.
      </p>
    </div>
  );
}

export default MonitoramentoPage;
