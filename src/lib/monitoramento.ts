// Monitoramento: o que não depende do usuário, mas que ele precisa acompanhar.
// NFs, contas a receber e empenhos são lidos ao vivo do BasePro e do Nexo;
// no Tarefeiro fica só a anotação do usuário (cobrar em, notas, dispensado).
import type { SupabaseClient } from '@supabase/supabase-js';
import { MonitoringItem, Sistema, TipoMonitorado } from '../types';
import { diaDe } from './tarefas';

export interface ItemMonitorado {
  chave: string;
  origem: 'manual' | Sistema;
  ref?: string; // <tabela>:<id> no sistema de origem
  tipo: TipoMonitorado;
  titulo: string;
  detalhe?: string;
  cliente?: string;
  valor?: number;
  data?: string; // yyyy-MM-dd: vencimento, previsão de entrega ou prazo de entrega
  rotuloData?: string;
  anotacao?: MonitoringItem;
}

export const rotuloTipoMonitorado: Record<TipoMonitorado, string> = {
  nf_transito: 'NF em trânsito',
  conta_receber: 'A receber',
  empenho: 'Empenho',
  aguardando_retorno: 'Aguardando retorno',
};

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const num = (v: unknown): number | undefined =>
  v === null || v === undefined || v === '' ? undefined : Math.round(Number(v) * 100) / 100;

const chaveDe = (origem: string, ref: string) => `${origem}|${ref}`;

// Sem previsão de entrega no sistema, espera-se a NF entregue até 7 dias após a emissão
const DIAS_ENTREGA_ESPERADA = 7;
function maisDias(dia: string, dias: number): string {
  const [a, m, d] = dia.slice(0, 10).split('-').map(Number);
  return diaDe(new Date(a, m - 1, d + dias));
}
const curta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

function falhou(res: { error: { message: string } | null }, oQue: string) {
  if (res.error) throw new Error(`${oQue}: ${res.error.message}`);
}

// ============ BasePro ============
export async function buscarBasePro(db: SupabaseClient): Promise<ItemMonitorado[]> {
  const [nfs, receber] = await Promise.all([
    db.from('invoices')
      .select('id, invoice_number, client_name_snapshot, issue_date, delivery_forecast, carrier_name, total_value, status')
      .eq('delivery_status', 'EM_TRANSITO'),
    db.from('accounts_receivable')
      .select('id, invoice_number_snapshot, client_name_snapshot, installment_number, amount, received_amount, balance, due_date, status')
      .in('status', ['PENDENTE', 'PARCIAL']),
  ]);
  falhou(nfs, 'NFs do BasePro');
  falhou(receber, 'Contas a receber do BasePro');

  const itens: ItemMonitorado[] = [];

  for (const nf of nfs.data ?? []) {
    if (nf.status === 'CANCELADA') continue;
    const ref = `invoices:${nf.id}`;
    itens.push({
      chave: chaveDe('basepro', ref), origem: 'basepro', ref, tipo: 'nf_transito',
      titulo: `NF ${nf.invoice_number}`,
      detalhe: nf.carrier_name ? `Venda · ${nf.carrier_name}` : 'Venda',
      cliente: nf.client_name_snapshot ?? undefined,
      valor: num(nf.total_value),
      ...(nf.delivery_forecast
        ? { data: nf.delivery_forecast, rotuloData: 'Previsão de entrega' }
        : { data: maisDias(nf.issue_date, DIAS_ENTREGA_ESPERADA), rotuloData: `Emitida ${curta(nf.issue_date)} · esperada até` }),
    });
  }

  for (const r of receber.data ?? []) {
    const ref = `accounts_receivable:${r.id}`;
    const saldo = num(r.balance) ?? (num(r.amount) ?? 0) - (num(r.received_amount) ?? 0);
    itens.push({
      chave: chaveDe('basepro', ref), origem: 'basepro', ref, tipo: 'conta_receber',
      titulo: `NF ${r.invoice_number_snapshot ?? '—'}${r.installment_number ? ` · parcela ${r.installment_number}` : ''}`,
      detalhe: r.status === 'PARCIAL' ? 'Recebida em parte' : undefined,
      cliente: r.client_name_snapshot ?? undefined,
      valor: num(saldo),
      data: r.due_date ?? undefined,
      rotuloData: 'Vencimento',
    });
  }

  return itens;
}

// ============ Nexo ============
export async function buscarNexo(db: SupabaseClient): Promise<ItemMonitorado[]> {
  const [fat, compras, receitas, empenhos] = await Promise.all([
    db.from('faturamentos')
      .select('id, numero_nf, cliente_nome_snapshot, data_emissao, valor_total, status_entrega')
      .eq('tipo_operacao', 'VENDA')
      .neq('status_entrega', 'ENTREGUE')
      .neq('status_fiscal', 'DEVOLVIDA_TOTAL'),
    db.from('notas_fiscais_recebidas')
      .select('id, numero_nf, emitente_nome, data_emissao, valor_total')
      .eq('status_interno', 'detectada'),
    db.from('transacoes_financeiras')
      .select('id, descricao, cliente_nome, valor, valor_pago, data_vencimento, venda_id, categorias_financeiras!inner(tipo, eh_transferencia_interna)')
      .eq('status', 'PENDENTE')
      .eq('categorias_financeiras.tipo', 'RECEITA'),
    db.from('contrato_empenhos')
      .select('id, numero_empenho, valor_total, status, numero_nf, faturamento_id, data_limite_entrega, cliente_nome, contratos(cliente_nome, nome_produto), faturamentos(status_entrega)')
      .in('status', ['PENDENTE', 'PARCIAL', 'FATURADO']),
  ]);
  falhou(fat, 'NFs do Nexo');
  falhou(compras, 'NFs de compra do Nexo');
  falhou(receitas, 'Contas a receber do Nexo');
  falhou(empenhos, 'Empenhos do Nexo');

  const itens: ItemMonitorado[] = [];

  for (const nf of fat.data ?? []) {
    const ref = `faturamentos:${nf.id}`;
    itens.push({
      chave: chaveDe('nexo', ref), origem: 'nexo', ref, tipo: 'nf_transito',
      titulo: `NF ${nf.numero_nf}`,
      detalhe: nf.status_entrega === 'A_SEPARAR' ? 'Venda · a separar' : 'Venda · na fila de entrega',
      cliente: nf.cliente_nome_snapshot ?? undefined,
      valor: num(nf.valor_total),
      data: maisDias(nf.data_emissao, DIAS_ENTREGA_ESPERADA),
      rotuloData: `Emitida ${curta(nf.data_emissao)} · esperada até`,
    });
  }

  for (const nf of compras.data ?? []) {
    const ref = `notas_fiscais_recebidas:${nf.id}`;
    itens.push({
      chave: chaveDe('nexo', ref), origem: 'nexo', ref, tipo: 'nf_transito',
      titulo: `NF ${nf.numero_nf ?? '—'}`,
      detalhe: 'Compra · detectada na SEFAZ',
      cliente: nf.emitente_nome ?? undefined,
      valor: num(nf.valor_total),
      ...(nf.data_emissao
        ? {
            data: maisDias(String(nf.data_emissao), DIAS_ENTREGA_ESPERADA),
            rotuloData: `Emitida ${curta(String(nf.data_emissao))} · esperada até`,
          }
        : {}),
    });
  }

  // Parcelas a receber por faturamento: dizem em que pé está o pagamento do empenho
  const vencimentoPendentePorFat = new Map<string, string>();
  for (const t of receitas.data ?? []) {
    const categoria = t.categorias_financeiras as unknown as { eh_transferencia_interna?: boolean } | null;
    if (categoria?.eh_transferencia_interna) continue;
    if (t.venda_id) {
      const atual = vencimentoPendentePorFat.get(t.venda_id);
      if (!atual || t.data_vencimento < atual) vencimentoPendentePorFat.set(t.venda_id, t.data_vencimento);
    }
    const ref = `transacoes_financeiras:${t.id}`;
    itens.push({
      chave: chaveDe('nexo', ref), origem: 'nexo', ref, tipo: 'conta_receber',
      titulo: t.descricao,
      cliente: t.cliente_nome ?? undefined,
      valor: num((num(t.valor) ?? 0) - (num(t.valor_pago) ?? 0)),
      data: t.data_vencimento ?? undefined,
      rotuloData: 'Vencimento',
    });
  }

  // Empenho faturado sem parcela pendente: confere se tem financeiro (senão, já foi recebido)
  const faturadosSemPendencia = (empenhos.data ?? [])
    .filter((e) => e.status === 'FATURADO' && e.faturamento_id && !vencimentoPendentePorFat.has(e.faturamento_id))
    .map((e) => e.faturamento_id as string);
  const comFinanceiro = new Set<string>();
  if (faturadosSemPendencia.length > 0) {
    const fin = await db.from('transacoes_financeiras').select('venda_id').in('venda_id', faturadosSemPendencia);
    falhou(fin, 'Financeiro dos empenhos do Nexo');
    for (const t of fin.data ?? []) comFinanceiro.add(t.venda_id);
  }

  for (const e of empenhos.data ?? []) {
    const contrato = e.contratos as unknown as { cliente_nome?: string; nome_produto?: string } | null;
    const faturamento = e.faturamentos as unknown as { status_entrega?: string } | null;
    const vencimento = e.faturamento_id ? vencimentoPendentePorFat.get(e.faturamento_id) : undefined;

    // Estágios: empenhado → faturado → entregue → pago (liquidação não é registrada no Nexo)
    let estagio: string;
    let data = e.data_limite_entrega ?? undefined;
    let rotuloData = 'Entregar até';
    if (e.status === 'PENDENTE') {
      estagio = 'Empenhado · aguardando faturamento';
    } else if (e.status === 'PARCIAL') {
      estagio = 'Faturado em parte';
    } else if (faturamento?.status_entrega !== 'ENTREGUE') {
      estagio = `Faturado${e.numero_nf ? ` (NF ${e.numero_nf})` : ''} · a entregar`;
    } else if (vencimento) {
      estagio = 'Entregue · aguardando pagamento';
      data = vencimento;
      rotuloData = 'Vencimento';
    } else if (e.faturamento_id && comFinanceiro.has(e.faturamento_id)) {
      continue; // pago
    } else {
      estagio = 'Entregue · sem lançamento no financeiro';
    }

    const ref = `contrato_empenhos:${e.id}`;
    itens.push({
      chave: chaveDe('nexo', ref), origem: 'nexo', ref, tipo: 'empenho',
      titulo: `Empenho ${e.numero_empenho}`,
      detalhe: contrato?.nome_produto ? `${estagio} · ${contrato.nome_produto}` : estagio,
      cliente: e.cliente_nome ?? contrato?.cliente_nome ?? undefined,
      valor: num(e.valor_total),
      data,
      rotuloData,
    });
  }

  return itens;
}

// ============ Juntar com as anotações e itens manuais do Tarefeiro ============
export function combinar(externos: ItemMonitorado[], anotacoes: MonitoringItem[]) {
  const porChave = new Map(
    anotacoes.filter((a) => a.refExterna).map((a) => [chaveDe(a.origem, a.refExterna!), a])
  );

  const comAnotacao = externos.map((item) => ({ ...item, anotacao: porChave.get(item.chave) }));
  const manuais: ItemMonitorado[] = anotacoes
    .filter((a) => a.origem === 'manual' && a.status === 'aberto')
    .map((a) => ({
      chave: a.id, origem: 'manual', tipo: a.kind, titulo: a.title,
      detalhe: a.reference, valor: a.amount,
      data: diaDe(a.expectedDate) || undefined, rotuloData: 'Previsão',
      anotacao: a,
    }));

  const todos = [...comAnotacao, ...manuais];
  return {
    ativos: todos.filter((i) => i.anotacao?.status !== 'cancelado' && i.anotacao?.status !== 'resolvido'),
    dispensados: comAnotacao.filter((i) => i.anotacao?.status === 'cancelado'),
  };
}

// Data que manda no item: o "cobrar em" do usuário, ou a data do próprio item
export const dataDeAtencao = (item: ItemMonitorado): string =>
  diaDe(item.anotacao?.followUpOn) || item.data || '';

export function agrupar(itens: ItemMonitorado[], hoje: string) {
  const emUmaSemana = diaDe(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const porData = (a: ItemMonitorado, b: ItemMonitorado) =>
    (dataDeAtencao(a) || '9999').localeCompare(dataDeAtencao(b) || '9999');

  const atencao: ItemMonitorado[] = [];
  const semana: ItemMonitorado[] = [];
  const depois: ItemMonitorado[] = [];
  for (const item of itens) {
    const d = dataDeAtencao(item);
    if (d && d <= hoje) atencao.push(item);
    else if (d && d <= emUmaSemana) semana.push(item);
    else depois.push(item);
  }
  return { atencao: atencao.sort(porData), semana: semana.sort(porData), depois: depois.sort(porData) };
}

// Totais por tipo, nunca somados entre si: saldo a receber, valor empenhado
// em aberto e valor em NFs a entregar são grandezas diferentes.
// O a receber também fica separado por sistema: no BasePro (representação) são
// títulos que os clientes devem à representada; no Nexo, o que devem à empresa.
export function totais(itens: ItemMonitorado[]) {
  const doTipo = (tipo: TipoMonitorado, origem?: ItemMonitorado['origem']) =>
    itens.filter((i) => i.tipo === tipo && (!origem || i.origem === origem));
  const soma = (tipo: TipoMonitorado, origem?: ItemMonitorado['origem']) =>
    doTipo(tipo, origem).reduce((acc, i) => acc + (i.valor ?? 0), 0);
  const qtd = (tipo: TipoMonitorado, origem?: ItemMonitorado['origem']) => doTipo(tipo, origem).length;
  return {
    receberNexo: { valor: soma('conta_receber', 'nexo'), qtd: qtd('conta_receber', 'nexo') },
    titulosBasePro: { valor: soma('conta_receber', 'basepro'), qtd: qtd('conta_receber', 'basepro') },
    empenhos: { valor: soma('empenho'), qtd: qtd('empenho') },
    nfs: { valor: soma('nf_transito'), qtd: qtd('nf_transito') },
    retorno: { qtd: qtd('aguardando_retorno') },
  };
}
