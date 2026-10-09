// Robô de e-mail: lê só o que mudou (delta do Microsoft Graph) em Entrada e Enviados,
// grava o e-mail completo, classifica por regras e registra a rodada em sync_runs.
// Chamado pelo agendador (header x-sync-key) ou pelo app com a sessão do usuário ("Atualizar agora").
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { cors, json, mensagemDeErro, pedirToken, servidor, usuarioDaRequisicao } from '../_shared/microsoft.ts';
import { classificar, Regra } from './classificar.ts';

const PASTAS = ['inbox', 'sentitems'] as const;
type Pasta = (typeof PASTAS)[number];

// Primeira carga: últimos 60 dias (o Graph limita a 5.000 mensagens por pasta com filtro)
const JANELA_INICIAL_DIAS = 60;
// Tempo máximo por chamada; o que faltar continua na próxima rodada a partir do cursor salvo
const ORCAMENTO_MS = 110_000;
const ANEXOS_POR_RODADA = 25;

const CAMPOS = [
  'id', 'conversationId', 'internetMessageId', 'subject', 'bodyPreview', 'body', 'from', 'toRecipients',
  'ccRecipients', 'receivedDateTime', 'sentDateTime', 'isRead', 'importance', 'flag', 'hasAttachments',
  'inferenceClassification', 'webLink',
].join(',');

const db = servidor();

function urlInicial(pasta: Pasta): string {
  const desde = new Date(Date.now() - JANELA_INICIAL_DIAS * 24 * 60 * 60 * 1000).toISOString().slice(0, 19) + 'Z';
  const params = new URLSearchParams({ $select: CAMPOS, $filter: `receivedDateTime ge ${desde}` });
  return `https://graph.microsoft.com/v1.0/me/mailFolders/${pasta}/messages/delta?${params}`;
}

interface Placar {
  novos: number;
  atualizados: number;
  removidos: number;
}

interface Conta {
  id: string;
  user_id: string;
  endereco: string;
}

// deno-lint-ignore no-explicit-any
type Mensagem = Record<string, any>;

const pessoas = (lista: Mensagem[] | undefined) =>
  (lista ?? []).map((p) => ({ nome: p.emailAddress?.name ?? null, endereco: p.emailAddress?.address ?? null }));

// E-mail de propaganda vem com centenas de caracteres invisíveis de enchimento: tira e junta os espaços
function limparTexto(texto: string | null | undefined): string | null {
  if (!texto) return null;
  return texto
    .replace(/[\u200B-\u200D\u2060\uFEFF\u034F\u00AD]/g, '')
    .replace(/[ \t\u00A0]+/g, ' ')
    .replace(/ *\r?\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function listarAnexos(conta: Conta, idExterno: string, token: string) {
  const res = await graph(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(idExterno)}/attachments?$select=name,size,contentType`, token);
  if (!res.ok) return;
  const { value } = await res.json();
  const anexos = (value ?? []).map((a: Mensagem) => ({ nome: a.name, tamanho: a.size, tipo: a.contentType }));
  await db.from('emails').update({ anexos }).eq('conta_id', conta.id).eq('id_externo', idExterno);
}

async function graph(url: string, token: string) {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      // 25 por página: os ids da Microsoft são longos e vão na URL das consultas ao banco
      Prefer: 'outlook.body-content-type="text", odata.maxpagesize=25',
    },
  });
}

async function gravarPagina(conta: Conta, pasta: Pasta, mensagens: Mensagem[], regras: Regra[], placar: Placar, token: string, anexosRestantes: { n: number }) {
  const removidas = mensagens.filter((m) => m['@removed']).map((m) => m.id as string);
  if (removidas.length) {
    await db.from('emails').update({ removido_em: new Date().toISOString() })
      .eq('conta_id', conta.id).in('id_externo', removidas).is('removido_em', null);
    placar.removidos += removidas.length;
  }

  // Atualização parcial (sem assunto) acontece em mudanças só de lido/não lido
  const parciais = mensagens.filter((m) => !m['@removed'] && !('subject' in m));
  for (const m of parciais) {
    if ('isRead' in m) await db.from('emails').update({ lido: m.isRead }).eq('conta_id', conta.id).eq('id_externo', m.id);
  }

  const completas = mensagens.filter((m) => !m['@removed'] && 'subject' in m);
  if (!completas.length) return;

  const ids = completas.map((m) => m.id as string);
  const { data: existentes } = await db.from('emails').select('id_externo, categoria_manual')
    .eq('conta_id', conta.id).in('id_externo', ids);
  const jaExiste = new Map((existentes ?? []).map((e) => [e.id_externo, e.categoria_manual as boolean]));

  const linhas = completas.map((m) => {
    const remetente = m.from?.emailAddress?.address ?? '';
    const base = {
      user_id: conta.user_id,
      conta_id: conta.id,
      id_externo: m.id,
      pasta,
      conversa_id: m.conversationId ?? null,
      internet_message_id: m.internetMessageId ?? null,
      de_nome: m.from?.emailAddress?.name ?? null,
      de_endereco: remetente || null,
      para: pessoas(m.toRecipients),
      cc: pessoas(m.ccRecipients),
      assunto: m.subject ?? null,
      previa: m.bodyPreview ?? null,
      recebido_em: m.receivedDateTime ?? null,
      enviado_em: m.sentDateTime ?? null,
      lido: m.isRead ?? null,
      importancia: m.importance ?? null,
      sinalizado: m.flag?.flagStatus === 'flagged',
      tem_anexos: !!m.hasAttachments,
      foco: m.inferenceClassification ?? null,
      link_web: m.webLink ?? null,
      removido_em: null,
    };
    // Classificação só na Entrada, e nunca por cima da correção do usuário
    if (pasta !== 'inbox' || jaExiste.get(m.id) === true) return { manual: true, linha: base };
    const { categoria, motivo } = classificar(
      {
        remetente,
        assunto: m.subject ?? '',
        previa: m.bodyPreview ?? '',
        foco: m.inferenceClassification,
        importancia: m.importance,
        sinalizado: base.sinalizado,
      },
      regras
    );
    return { manual: false, linha: { ...base, categoria, motivo_categoria: motivo } };
  });

  const gravadas: { id: string; id_externo: string }[] = [];
  for (const grupo of [linhas.filter((l) => !l.manual), linhas.filter((l) => l.manual)]) {
    if (!grupo.length) continue;
    const { data, error } = await db.from('emails')
      .upsert(grupo.map((l) => l.linha), { onConflict: 'conta_id,id_externo' })
      .select('id, id_externo');
    if (error) throw new Error(`Não consegui gravar e-mails (${pasta}): ${error.message}`);
    gravadas.push(...(data ?? []));
  }

  const porExterno = new Map(gravadas.map((g) => [g.id_externo, g.id]));
  const corpos = completas
    .filter((m) => porExterno.has(m.id))
    .map((m) => ({ email_id: porExterno.get(m.id)!, user_id: conta.user_id, texto: limparTexto(m.body?.content) }));
  if (corpos.length) {
    const { error } = await db.from('email_corpos').upsert(corpos, { onConflict: 'email_id' });
    if (error) throw new Error(`Não consegui gravar o corpo dos e-mails: ${error.message}`);
  }

  // Lista de anexos (nome e tamanho) dos e-mails novos; o conteúdo continua no Outlook
  for (const m of completas) {
    if (!m.hasAttachments || jaExiste.has(m.id) || anexosRestantes.n <= 0) continue;
    anexosRestantes.n--;
    await listarAnexos(conta, m.id, token);
  }

  for (const m of completas) {
    if (jaExiste.has(m.id)) placar.atualizados++;
    else placar.novos++;
  }
}

async function salvarCursor(contaId: string, pasta: Pasta, cursor: string | null, completa: boolean) {
  await db.from('email_pastas_sync').upsert(
    { conta_id: contaId, pasta, cursor, rodada_completa: completa, updated_at: new Date().toISOString() },
    { onConflict: 'conta_id,pasta' }
  );
}

// true = pasta em dia; false = parou pelo tempo e continua na próxima rodada
async function sincronizarPasta(conta: Conta, pasta: Pasta, token: string, regras: Regra[], placar: Placar, inicio: number, anexos: { n: number }) {
  const { data: estado } = await db.from('email_pastas_sync').select('cursor')
    .eq('conta_id', conta.id).eq('pasta', pasta).maybeSingle();
  let url = estado?.cursor ?? urlInicial(pasta);
  let recomecou = false;

  while (true) {
    if (Date.now() - inicio > ORCAMENTO_MS) {
      await salvarCursor(conta.id, pasta, url, false);
      return false;
    }
    const res = await graph(url, token);
    if (res.status === 410 && !recomecou) {
      // Ponto de leitura expirou na Microsoft: recomeça a rodada da pasta
      recomecou = true;
      url = urlInicial(pasta);
      continue;
    }
    if (!res.ok) {
      const corpo = await res.json().catch(() => ({}));
      throw new Error(`Graph recusou a leitura de ${pasta} (${res.status} ${corpo.error?.code ?? ''})`);
    }
    const pagina = await res.json();
    await gravarPagina(conta, pasta, pagina.value ?? [], regras, placar, token, anexos);

    if (pagina['@odata.nextLink']) {
      url = pagina['@odata.nextLink'];
    } else {
      await salvarCursor(conta.id, pasta, pagina['@odata.deltaLink'] ?? null, true);
      return true;
    }
  }
}

async function sincronizarConta(conta: Conta, inicio: number) {
  const { data: rodada } = await db.from('sync_runs')
    .insert({ user_id: conta.user_id, fonte: `email:${conta.endereco}` }).select('id').single();
  const placar: Placar = { novos: 0, atualizados: 0, removidos: 0 };
  let status: 'ok' | 'parcial' | 'erro' = 'ok';
  let detalhe: string | null = null;

  try {
    const { data: refresh } = await db.rpc('email_ler_token', { p_conta: conta.id });
    if (!refresh) throw new Error('Conta sem acesso guardado: conecte de novo em Configurações → Sistemas');

    const tokens = await pedirToken({ grant_type: 'refresh_token', refresh_token: String(refresh) });
    // A Microsoft gira o refresh token: guardar sempre o mais novo
    if (tokens.refresh_token) await db.rpc('email_guardar_token', { p_conta: conta.id, p_token: tokens.refresh_token });

    const { data: regras } = await db.from('email_regras').select('tipo, valor, categoria')
      .eq('user_id', conta.user_id).eq('ativa', true);

    const anexos = { n: ANEXOS_POR_RODADA };
    for (const pasta of PASTAS) {
      const emDia = await sincronizarPasta(conta, pasta, tokens.access_token, (regras ?? []) as Regra[], placar, inicio, anexos);
      if (!emDia) status = 'parcial';
    }
    if (status === 'parcial') detalhe = 'Primeira carga grande: continua na próxima rodada.';

    // Sobrou cota de anexos: completa a lista dos e-mails que ficaram para trás (primeira carga)
    if (anexos.n > 0 && Date.now() - inicio < ORCAMENTO_MS) {
      const { data: semLista } = await db.from('emails').select('id_externo')
        .eq('conta_id', conta.id).eq('tem_anexos', true).eq('anexos', '[]').is('removido_em', null)
        .order('recebido_em', { ascending: false }).limit(anexos.n);
      for (const e of semLista ?? []) await listarAnexos(conta, e.id_externo, tokens.access_token);
    }
    await db.from('email_contas').update({ ultimo_sync_em: new Date().toISOString(), ultimo_erro: null }).eq('id', conta.id);
  } catch (e) {
    status = 'erro';
    detalhe = mensagemDeErro(e);
    await db.from('email_contas').update({ ultimo_erro: detalhe }).eq('id', conta.id);
  }

  if (rodada) {
    await db.from('sync_runs')
      .update({ terminado_em: new Date().toISOString(), status, detalhe, ...placar })
      .eq('id', rodada.id);
  }
  return { conta: conta.endereco, status, detalhe, ...placar };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const inicio = Date.now();

  try {
    // Agendador: chave guardada no Vault. App: sessão do usuário (só as contas dele).
    let somenteDoUsuario: string | null = null;
    const chave = req.headers.get('x-sync-key');
    if (chave) {
      const { data: esperada } = await db.rpc('email_chave_sync');
      if (!esperada || chave !== esperada) return json({ erro: 'Chave inválida' }, 401);
    } else {
      const usuario = await usuarioDaRequisicao(req);
      if (!usuario) return json({ erro: 'Sessão do Tarefeiro inválida' }, 401);
      somenteDoUsuario = usuario.id;
    }

    const pedido = await req.json().catch(() => ({}));
    let consulta = db.from('email_contas').select('id, user_id, endereco').eq('ativa', true);
    if (somenteDoUsuario) consulta = consulta.eq('user_id', somenteDoUsuario);
    if (pedido?.conta_id) consulta = consulta.eq('id', pedido.conta_id);
    const { data: contas, error } = await consulta;
    if (error) throw new Error(`Não consegui listar as contas: ${error.message}`);

    const resultados = [];
    for (const conta of (contas ?? []) as Conta[]) resultados.push(await sincronizarConta(conta, inicio));
    return json({ contas: resultados.length, resultados });
  } catch (e) {
    return json({ erro: mensagemDeErro(e) }, 500);
  }
});
