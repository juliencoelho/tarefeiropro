// Monitoramento: o que não depende do usuário, mas que ele precisa acompanhar.
// NFs, contas a receber e empenhos são lidos ao vivo do BasePro e do Nexo;
// no Tarefeiro fica só a anotação do usuário (cobrar em, notas, dispensado).
import type { SupabaseClient } from '@supabase/supabase-js';
import { MonitoringItem, Sistema, TipoMonitorado } from '../types';
import { dataCurta as curta, diaDe } from './tarefas';

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
  // Empenho já faturado: a NF e a conta a receber dele contam a mesma história.
  // Fica no filtro Empenhos, mas sai da visão geral e das contagens de atenção.
  coberto?: boolean;
  anotacao?: MonitoringItem;
  // Chave da NF (<sistema>|<id ou número>) para juntar a entrega e o recebimento numa linha só
  nf?: string;
  // Estados da mesma NF reunidos nesta linha (ex.: a entregar + a receber)
  estados?: EstadoNf[];
  // A Hospicare comprando da CF: é conta a pagar da Hospicare, não cobrança do Julien
  compraPropria?: boolean;
}

export interface EstadoNf {
  texto: string;
  data?: string;
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


// Cliente "Hospicare" no BasePro = a empresa do Julien comprando da representada
const ehHospicare = (cliente?: string | null) => /hospicare/i.test(cliente ?? '');
const COMPRA_PROPRIA = 'Compra da Hospicare na CF · a pagar, não é cobrança';

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
    const compraPropria = ehHospicare(nf.client_name_snapshot);
    itens.push({
      chave: chaveDe('basepro', ref), origem: 'basepro', ref, tipo: 'nf_transito',
      titulo: `NF ${nf.invoice_number}`,
      detalhe: compraPropria
        ? `${COMPRA_PROPRIA}${nf.carrier_name ? ` · ${nf.carrier_name}` : ''}`
        : nf.carrier_name ? `Venda · ${nf.carrier_name}` : 'Venda',
      cliente: nf.client_name_snapshot ?? undefined,
      nf: nf.invoice_number ? `basepro|${nf.invoice_number}` : undefined,
      compraPropria,
      valor: num(nf.total_value),
      ...(nf.delivery_forecast
        ? { data: nf.delivery_forecast, rotuloData: 'Previsão de entrega' }
        : { data: maisDias(nf.issue_date, DIAS_ENTREGA_ESPERADA), rotuloData: `Emitida ${curta(nf.issue_date)} · esperada até` }),
    });
  }

  for (const r of receber.data ?? []) {
    const ref = `accounts_receivable:${r.id}`;
    const saldo = num(r.balance) ?? (num(r.amount) ?? 0) - (num(r.received_amount) ?? 0);
    const compraPropria = ehHospicare(r.client_name_snapshot);
    const detalhes = [compraPropria && COMPRA_PROPRIA, r.status === 'PARCIAL' && 'Recebida em parte'].filter(Boolean);
    itens.push({
      chave: chaveDe('basepro', ref), origem: 'basepro', ref, tipo: 'conta_receber',
      titulo: `NF ${r.invoice_number_snapshot ?? '—'}${r.installment_number ? ` · parcela ${r.installment_number}` : ''}`,
      detalhe: detalhes.length ? detalhes.join(' · ') : undefined,
      cliente: r.client_name_snapshot ?? undefined,
      nf: r.invoice_number_snapshot ? `basepro|${r.invoice_number_snapshot}` : undefined,
      compraPropria,
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

  // Empenhos por faturamento, para mostrar "Empenho X" na NF e na conta a receber
  const empenhosPorFat = new Map<string, string[]>();
  for (const e of empenhos.data ?? []) {
    if (!e.faturamento_id) continue;
    const nums = empenhosPorFat.get(e.faturamento_id) ?? [];
    if (!nums.includes(e.numero_empenho)) nums.push(e.numero_empenho);
    empenhosPorFat.set(e.faturamento_id, nums);
  }
  const doEmpenho = (fatId?: string | null) => {
    const nums = fatId ? empenhosPorFat.get(fatId) : undefined;
    return nums ? ` · Empenho ${nums.join(', ')}` : '';
  };

  for (const nf of fat.data ?? []) {
    const ref = `faturamentos:${nf.id}`;
    itens.push({
      chave: chaveDe('nexo', ref), origem: 'nexo', ref, tipo: 'nf_transito',
      titulo: `NF ${nf.numero_nf}`,
      detalhe: (nf.status_entrega === 'A_SEPARAR' ? 'Venda · a separar' : 'Venda · na fila de entrega') + doEmpenho(nf.id),
      cliente: nf.cliente_nome_snapshot ?? undefined,
      nf: `nexo|${nf.id}`,
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
      detalhe: doEmpenho(t.venda_id).replace(/^ · /, '') || undefined,
      cliente: t.cliente_nome ?? undefined,
      nf: t.venda_id ? `nexo|${t.venda_id}` : undefined,
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

  const nfsNaLista = new Set((fat.data ?? []).map((nf) => nf.id));

  // O Nexo guarda uma linha por produto do empenho: agrupa por número + órgão + estágio
  interface Grupo {
    numero: string;
    orgao?: string;
    estagio: string;
    produtos: string[];
    valor: number;
    data?: string;
    rotuloData: string;
    coberto: boolean;
  }
  const grupos = new Map<string, Grupo>();

  for (const e of empenhos.data ?? []) {
    const contrato = e.contratos as unknown as { cliente_nome?: string; nome_produto?: string } | null;
    const faturamento = e.faturamentos as unknown as { status_entrega?: string } | null;
    const vencimento = e.faturamento_id ? vencimentoPendentePorFat.get(e.faturamento_id) : undefined;

    // Estágios: empenhado → faturado → entregue → pago (liquidação não é registrada no Nexo)
    let estagio: string;
    let data = e.data_limite_entrega ?? undefined;
    let rotuloData = 'Entregar até';
    let coberto = false;
    if (e.status === 'PENDENTE') {
      estagio = 'Empenhado · aguardando faturamento';
    } else if (e.status === 'PARCIAL') {
      estagio = 'Faturado em parte';
    } else if (faturamento?.status_entrega !== 'ENTREGUE') {
      estagio = `Faturado${e.numero_nf ? ` (NF ${e.numero_nf})` : ''} · a entregar`;
      coberto = !!e.faturamento_id && nfsNaLista.has(e.faturamento_id);
    } else if (vencimento) {
      estagio = 'Entregue · aguardando pagamento';
      data = vencimento;
      rotuloData = 'Vencimento';
      coberto = true;
    } else if (e.faturamento_id && comFinanceiro.has(e.faturamento_id)) {
      continue; // pago
    } else {
      estagio = 'Entregue · sem lançamento no financeiro';
    }

    const orgao = e.cliente_nome ?? contrato?.cliente_nome ?? undefined;
    const chaveGrupo = `${e.numero_empenho}@${orgao ?? ''}|${estagio}`;
    const g: Grupo = grupos.get(chaveGrupo) ?? {
      numero: e.numero_empenho, orgao, estagio, produtos: [], valor: 0, rotuloData, coberto: true,
    };
    if (contrato?.nome_produto) g.produtos.push(contrato.nome_produto);
    g.valor += num(e.valor_total) ?? 0;
    if (data && (!g.data || data < g.data)) g.data = data; // prazo mais urgente do grupo
    g.coberto = g.coberto && coberto;
    grupos.set(chaveGrupo, g);
  }

  for (const [chaveGrupo, g] of grupos) {
    // Referência estável do grupo (não é um id de linha): contrato_empenhos:<número>@<órgão>|<estágio>
    const ref = `contrato_empenhos:${chaveGrupo}`;
    const detalheProdutos =
      g.produtos.length === 0 ? '' : g.produtos.length === 1 ? ` · ${g.produtos[0]}` : ` · ${g.produtos.length} itens`;
    itens.push({
      chave: chaveDe('nexo', ref), origem: 'nexo', ref, tipo: 'empenho',
      titulo: `Empenho ${g.numero}`,
      detalhe: g.estagio + detalheProdutos,
      cliente: g.orgao,
      valor: num(g.valor),
      data: g.data,
      rotuloData: g.rotuloData,
      coberto: g.coberto,
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

// Atrasado há mais que isso sai da lista principal e fica recolhido no fim
export const DIAS_ATRASO_ANTIGO = 90;

export function agrupar(itens: ItemMonitorado[], hoje: string) {
  const emUmaSemana = diaDe(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const antigoAte = maisDias(hoje, -DIAS_ATRASO_ANTIGO);
  const porData = (a: ItemMonitorado, b: ItemMonitorado) =>
    (dataDeAtencao(a) || '9999').localeCompare(dataDeAtencao(b) || '9999');

  const atencao: ItemMonitorado[] = [];
  const semana: ItemMonitorado[] = [];
  const depois: ItemMonitorado[] = [];
  const antigos: ItemMonitorado[] = [];
  for (const item of itens) {
    const d = dataDeAtencao(item);
    if (d && d < antigoAte) antigos.push(item);
    else if (d && d <= hoje) atencao.push(item);
    else if (d && d <= emUmaSemana) semana.push(item);
    else depois.push(item);
  }
  return {
    atencao: atencao.sort(porData),
    semana: semana.sort(porData),
    depois: depois.sort(porData),
    antigos: antigos.sort(porData),
  };
}

// ============ Mesma NF em dois estados ============
// A NF que ainda não foi entregue e a parcela a receber dela contam a mesma história.
// Fica uma linha só, com os dois estados; as outras ficam "cobertas" (saem da visão
// geral e das contagens, mas continuam nos filtros por tipo e nos totais).
const estadoDe = (i: ItemMonitorado): EstadoNf =>
  i.tipo === 'nf_transito'
    ? { texto: `A entregar${i.data ? ` · esperada até ${curta(i.data)}` : ''}`, data: i.data }
    : {
        texto: `A receber${i.valor !== undefined ? ` ${brl.format(i.valor)}` : ''}${i.data ? ` · vence ${curta(i.data)}` : ''}`,
        data: i.data,
      };

export function unificarNotas(itens: ItemMonitorado[]): ItemMonitorado[] {
  const porNf = new Map<string, ItemMonitorado[]>();
  for (const i of itens) {
    if (!i.nf || i.coberto || (i.tipo !== 'nf_transito' && i.tipo !== 'conta_receber')) continue;
    porNf.set(i.nf, [...(porNf.get(i.nf) ?? []), i]);
  }

  const trocas = new Map<string, ItemMonitorado>();
  for (const grupo of porNf.values()) {
    const entrega = grupo.find((i) => i.tipo === 'nf_transito');
    const parcelas = grupo.filter((i) => i.tipo === 'conta_receber');
    if (!entrega || parcelas.length === 0) continue;

    // Fica a linha que já tem "cobrar em"; senão a da entrega, que vem antes do pagamento
    const principal = grupo.find((i) => i.anotacao?.followUpOn) ?? entrega;
    const datas = grupo.map((i) => i.data).filter((d): d is string => !!d).sort();
    trocas.set(principal.chave, {
      ...principal,
      estados: [entrega, ...parcelas].map(estadoDe),
      // A data mais urgente das duas manda na posição da linha
      data: datas[0] ?? principal.data,
    });
    for (const outro of grupo) if (outro !== principal) trocas.set(outro.chave, { ...outro, coberto: true });
  }
  return itens.map((i) => trocas.get(i.chave) ?? i);
}

// ============ Seções: cada empresa no seu lugar ============
export type SecaoMonitorada = 'hospicare' | 'fernandes' | 'retorno';

export const secaoDe = (i: ItemMonitorado): SecaoMonitorada =>
  i.origem === 'nexo' ? 'hospicare' : i.origem === 'basepro' ? 'fernandes' : 'retorno';

export const rotuloSecao: Record<SecaoMonitorada, { nome: string; explicacao: string }> = {
  hospicare: { nome: 'Hospicare', explicacao: 'sua empresa: a receber, NFs a entregar e empenhos' },
  fernandes: { nome: 'Cirúrgica Fernandes', explicacao: 'títulos e NFs da representada, base da comissão' },
  retorno: { nome: 'Aguardando retorno', explicacao: 'pessoas e respostas que você está esperando' },
};

// ============ Cobrar hoje (tela Hoje) ============
// Só o que vence agora: "cobrar em" até hoje, aguardando retorno vencido e item dos
// sistemas vencido há no máximo 7 dias. O mais velho vira uma linha só, com link.
export const DIAS_COBRAR_HOJE = 7;

export function paraCobrarAgora(itens: ItemMonitorado[], hoje: string) {
  const limite = maisDias(hoje, -DIAS_COBRAR_HOJE);
  const agora: ItemMonitorado[] = [];
  const antigos: ItemMonitorado[] = [];
  for (const i of itens) {
    if (i.coberto || i.compraPropria) continue;
    const cobrarEm = diaDe(i.anotacao?.followUpOn);
    if (cobrarEm) {
      if (cobrarEm <= hoje) agora.push(i);
      continue;
    }
    if (!i.data || i.data > hoje) continue;
    if (i.origem === 'manual' || i.data >= limite) agora.push(i);
    else antigos.push(i);
  }
  const porData = (a: ItemMonitorado, b: ItemMonitorado) => dataDeAtencao(a).localeCompare(dataDeAtencao(b));
  return { agora: agora.sort(porData), antigos };
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
    nfsNexo: { valor: soma('nf_transito', 'nexo'), qtd: qtd('nf_transito', 'nexo') },
    nfsBasePro: { valor: soma('nf_transito', 'basepro'), qtd: qtd('nf_transito', 'basepro') },
    retorno: { qtd: qtd('aguardando_retorno') },
  };
}
