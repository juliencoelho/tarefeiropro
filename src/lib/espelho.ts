// Espelho de tarefas que nascem fora do Tarefeiro: agenda do BasePro e chamados de
// suporte do Nexo. O app lê cada sistema com o login do usuário lá (só leitura) e
// manda os itens para a função espelhar_tarefas, que cria a tarefa uma única vez e
// a conclui quando o item é fechado na origem. Nada é escrito no BasePro nem no Nexo.
import type { SupabaseClient } from '@supabase/supabase-js';
import { Area, Sistema, TaskPriority, TaskStatus } from '../types';
import { supabase } from './supabase';

interface ItemEspelho {
  ref: string;
  aberto: boolean;
  titulo?: string;
  descricao?: string;
  prazo?: string | null;
  prazo_original?: string | null;
  inicio?: string | null;
  fim?: string | null;
  tipo?: 'tarefa' | 'evento';
  status?: TaskStatus;
  prioridade?: TaskPriority;
  area_id?: string | null;
  fechado_em?: string | null;
}

const dataCurta = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

// ---------- Agenda do BasePro ----------
const STATUS_BASEPRO: Record<string, TaskStatus> = {
  pendente: 'para_fazer',
  em_andamento: 'fazendo',
  aguardando_retorno: 'aguardando_retorno',
  longo_prazo: 'longo_prazo',
};

// A agenda do BasePro também guarda coisas da Hospicare ("(Hospicare) ...", "NEXO | ...",
// pedidos PED2026..., empenhos 2026NE..., pregões e contratos públicos). Na dúvida fica no
// BasePro, e o usuário muda a área se precisar: o espelho não mexe mais nela.
const ehDaHospicare = (texto: string) =>
  /(\bhospicare\b|\bnexo\b|\bped20\d{6}|\b20\d{2}ne\d+|\bempenho|\bpreg[aã]o|\blicita[cç]|\bcontrato \d)/i.test(texto);

async function lerAgendaBasePro(db: SupabaseClient, areaBase?: string, areaNexo?: string): Promise<ItemEspelho[]> {
  const { data, error } = await db.from('agenda_items')
    .select('id, kind, title, description, status, due_date, original_due_date, start_time, end_time, resolved_at')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(`Agenda do BasePro: ${error.message}`);
  return (data ?? []).map((a) => {
    const aberto = !['concluida', 'cancelada'].includes(a.status);
    return {
      ref: a.id,
      aberto,
      titulo: a.title,
      descricao: a.description ?? '',
      prazo: a.due_date,
      prazo_original: a.original_due_date,
      inicio: a.kind === 'event' ? a.start_time : null,
      fim: a.kind === 'event' ? a.end_time : null,
      tipo: a.kind === 'event' ? 'evento' : 'tarefa',
      status: STATUS_BASEPRO[a.status] ?? 'para_fazer',
      area_id: (ehDaHospicare(`${a.title ?? ''} ${a.description ?? ''}`) ? areaNexo : areaBase) ?? null,
      fechado_em: aberto ? null : a.resolved_at,
    };
  });
}

// ---------- Chamados de suporte do Nexo ----------
const PRIORIDADE_NEXO: Record<string, TaskPriority> = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente',
  CRITICA: 'urgente',
};

const TIPO_CHAMADO: Record<string, string> = { CORRECAO: 'Correção', MELHORIA: 'Melhoria', DUVIDA: 'Dúvida' };

async function lerChamadosNexo(db: SupabaseClient, areaNexo?: string): Promise<ItemEspelho[]> {
  const { data, error } = await db.from('suporte_tickets')
    .select('id, titulo, descricao, modulo, tipo, status, prioridade, solicitante_nome, created_at, concluido_em, cancelado_em')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(`Chamados do Nexo: ${error.message}`);
  return (data ?? []).map((t) => {
    const aberto = !['CONCLUIDO', 'CANCELADO'].includes(t.status);
    const detalhes = [
      t.modulo && `Módulo: ${t.modulo}`,
      t.tipo && `Tipo: ${TIPO_CHAMADO[t.tipo] ?? t.tipo}`,
      `Aberto${t.solicitante_nome ? ` por ${t.solicitante_nome}` : ''} em ${dataCurta(t.created_at)}`,
    ].filter(Boolean).join(' · ');
    return {
      ref: t.id,
      aberto,
      titulo: t.titulo,
      descricao: [t.descricao ?? '', '', `Chamado de suporte do Nexo. ${detalhes}`].join('\n').trim(),
      prioridade: PRIORIDADE_NEXO[t.prioridade] ?? 'media',
      area_id: areaNexo ?? null,
      fechado_em: aberto ? null : (t.concluido_em ?? t.cancelado_em),
    };
  });
}

export interface ResultadoEspelho {
  criadas: number;
  concluidas: number;
}

// Lê a origem do sistema e sincroniza. Lança erro com mensagem legível se falhar.
export async function espelharSistema(sistema: Sistema, db: SupabaseClient, areas: Area[]): Promise<ResultadoEspelho> {
  const areaDo = (s: Sistema) => areas.find((a) => a.sistema === s && !a.archived)?.id;
  const itens = sistema === 'basepro'
    ? await lerAgendaBasePro(db, areaDo('basepro'), areaDo('nexo'))
    : await lerChamadosNexo(db, areaDo('nexo'));
  if (itens.length === 0) return { criadas: 0, concluidas: 0 };

  const { data, error } = await supabase.rpc('espelhar_tarefas', { p_source: sistema, p_itens: itens });
  if (error) throw new Error(`Não consegui trazer as tarefas do ${sistema === 'basepro' ? 'BasePro' : 'Nexo'}: ${error.message}`);
  return data as ResultadoEspelho;
}
