import { useState } from 'react';
import { AlarmClock, Check, Eye, EyeOff, Hourglass, Landmark, StickyNote, Truck, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { TipoMonitorado } from '../../types';
import { brl, ItemMonitorado } from '../../lib/monitoramento';
import { diaDe, hojeStr } from '../../lib/tarefas';
import { cn, createLocalDate, formatDateForInput } from '../../lib/utils';

const icones: Record<TipoMonitorado, typeof Truck> = {
  nf_transito: Truck,
  conta_receber: Wallet,
  empenho: Landmark,
  aguardando_retorno: Hourglass,
};

const curta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const daquiA = (dias: number) => new Date(new Date().setHours(0, 0, 0, 0) + dias * 24 * 60 * 60 * 1000);

const botao =
  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors';
const chip =
  'px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';

interface Props {
  item: ItemMonitorado;
  // Versão enxuta para a tela Hoje: só o essencial e o "cobrar em"
  compacta?: boolean;
}

export function LinhaMonitorada({ item, compacta }: Props) {
  const { areas, salvarAnotacao, updateMonitoringItem } = useAppStore();
  const [painel, setPainel] = useState<'cobrar' | 'nota' | null>(null);
  const [nota, setNota] = useState('');

  const hoje = hojeStr();
  const Icone = icones[item.tipo];
  const area = item.origem !== 'manual' ? areas.find((a) => a.sistema === item.origem) : undefined;
  const cobrarEm = diaDe(item.anotacao?.followUpOn);
  const vencido = !!item.data && item.data < hoje && item.tipo !== 'aguardando_retorno';
  const dispensado = item.anotacao?.status === 'cancelado';

  // Itens manuais já são a própria anotação; externos precisam da "base" para criá-la
  const anotar = (updates: Parameters<typeof salvarAnotacao>[1]) => {
    if (item.origem === 'manual' && item.anotacao) {
      updateMonitoringItem(item.anotacao.id, updates);
      return;
    }
    salvarAnotacao(
      {
        origem: item.origem,
        refExterna: item.ref,
        kind: item.tipo,
        title: [item.titulo, item.cliente].filter(Boolean).join(' · '),
        amount: item.valor,
        expectedDate: item.data ? createLocalDate(item.data) : undefined,
      },
      updates
    );
  };

  const definirCobranca = (dia: Date | undefined) => {
    // Marcar uma cobrança traz de volta um item dispensado
    anotar({ followUpOn: dia, ...(dispensado ? { status: 'aberto' as const } : {}) });
    setPainel(null);
    if (dia) toast(`Cobrar em ${curta(formatDateForInput(dia))}`);
  };

  const encerrar = () => {
    if (dispensado) {
      anotar({ status: 'aberto' });
      toast('De volta ao monitoramento');
    } else if (item.origem === 'manual') {
      anotar({ status: 'resolvido', resolvedAt: new Date() });
      toast('Resolvido', { action: { label: 'Desfazer', onClick: () => anotar({ status: 'aberto', resolvedAt: undefined }) } });
    } else {
      anotar({ status: 'cancelado' });
      toast('Dispensado do monitoramento', { action: { label: 'Desfazer', onClick: () => anotar({ status: 'aberto' }) } });
    }
  };

  return (
    <li className="px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
      <div className="flex items-start gap-3">
        <Icone className="w-4 h-4 mt-0.5 shrink-0 text-slate-400 dark:text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
              {item.titulo}
              {item.cliente && <span className="font-normal text-slate-600 dark:text-slate-300"> · {item.cliente}</span>}
            </p>
            {item.valor !== undefined && (
              <span className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100 shrink-0">
                {brl.format(item.valor)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-300">
            {area && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                {area.name}
              </span>
            )}
            {!compacta && item.detalhe && <span>{item.detalhe}</span>}
            {item.data && (
              <span className={cn(vencido && !cobrarEm && 'text-red-600 dark:text-red-400 font-medium')}>
                {item.rotuloData} {curta(item.data)}
              </span>
            )}
            {cobrarEm && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-medium',
                  cobrarEm <= hoje ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'
                )}
              >
                <AlarmClock className="w-3.5 h-3.5" />
                Cobrar {cobrarEm === hoje ? 'hoje' : `em ${curta(cobrarEm)}`}
              </span>
            )}
          </div>

          {!compacta && item.anotacao?.notes && (
            <p className="mt-1.5 text-xs italic text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.anotacao.notes}</p>
          )}

          <div className="flex flex-wrap items-center gap-1 mt-1.5 -ml-2">
            <button onClick={() => setPainel(painel === 'cobrar' ? null : 'cobrar')} className={botao}>
              <AlarmClock className="w-3.5 h-3.5" /> Cobrar em
            </button>
            {!compacta && (
              <>
                <button
                  onClick={() => {
                    setNota(item.anotacao?.notes ?? '');
                    setPainel(painel === 'nota' ? null : 'nota');
                  }}
                  className={botao}
                >
                  <StickyNote className="w-3.5 h-3.5" /> Anotar
                </button>
                <button onClick={encerrar} className={botao}>
                  {dispensado ? <Eye className="w-3.5 h-3.5" /> : item.origem === 'manual' ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {dispensado ? 'Restaurar' : item.origem === 'manual' ? 'Resolvido' : 'Dispensar'}
                </button>
              </>
            )}
          </div>

          {painel === 'cobrar' && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <button onClick={() => definirCobranca(daquiA(1))} className={chip}>Amanhã</button>
              <button onClick={() => definirCobranca(daquiA(3))} className={chip}>+3 dias</button>
              <button onClick={() => definirCobranca(daquiA(7))} className={chip}>+1 semana</button>
              <input
                type="date"
                min={hoje}
                onChange={(e) => e.target.value && definirCobranca(createLocalDate(e.target.value))}
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                aria-label="Escolher data para cobrar"
              />
              {cobrarEm && (
                <button onClick={() => definirCobranca(undefined)} className={cn(chip, 'inline-flex items-center gap-1')}>
                  <X className="w-3 h-3" /> Tirar data
                </button>
              )}
            </div>
          )}

          {painel === 'nota' && (
            <div className="mt-2 space-y-1.5">
              <textarea
                value={nota}
                autoFocus
                rows={2}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ex.: falei com o financeiro, prometeram pagar sexta"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    anotar({ notes: nota.trim() || undefined });
                    setPainel(null);
                  }}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                >
                  Salvar
                </button>
                <button onClick={() => setPainel(null)} className={botao}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
