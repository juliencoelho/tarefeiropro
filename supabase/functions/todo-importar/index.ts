// Traz as tarefas abertas do Microsoft To Do (conta do Hotmail) para o Tarefeiro.
// Chamado pelo app com a sessão do usuário. Só lê o To Do: nada muda lá.
// Cada tarefa entra uma única vez (espelhar_tarefas); rodar de novo só traz as novas.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ESCOPOS_TODO, cors, json, mensagemDeErro, pedirToken, servidor, usuarioDaRequisicao } from '../_shared/microsoft.ts';

// deno-lint-ignore no-explicit-any
type Item = Record<string, any>;

interface Area {
  id: string;
  name: string;
  sistema: string | null;
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Lista com o nome de uma área (ou que fala da empresa) já cai nela; o resto vai para a caixa de entrada
function areaDaLista(nomeLista: string, areas: Area[]): string | null {
  const nome = semAcento(nomeLista);
  const igual = areas.find((a) => semAcento(a.name) === nome);
  if (igual) return igual.id;
  const doSistema = (s: string) => areas.find((a) => a.sistema === s)?.id ?? null;
  if (/\b(base|basepro|cf|fernandes|representacao|cirurgica)\b/.test(nome)) return doSistema('basepro');
  if (/\b(nexo|hospicare)\b/.test(nome)) return doSistema('nexo');
  if (/\b(pessoal|casa|familia)\b/.test(nome)) return areas.find((a) => !a.sistema && semAcento(a.name) === 'pessoal')?.id ?? null;
  return null;
}

async function graph(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.body-content-type="text"' },
  });
  if (!res.ok) {
    const corpo = await res.json().catch(() => ({}));
    const erro = new Error(`To Do recusou a leitura (${res.status} ${corpo.error?.code ?? ''})`);
    (erro as Error & { status?: number }).status = res.status;
    throw erro;
  }
  return res.json();
}

// Segue as páginas (@odata.nextLink) até o fim
async function todas(url: string, token: string): Promise<Item[]> {
  const itens: Item[] = [];
  let proxima: string | undefined = url;
  while (proxima) {
    const pagina = await graph(proxima, token);
    itens.push(...(pagina.value ?? []));
    proxima = pagina['@odata.nextLink'];
  }
  return itens;
}

async function tarefasAbertas(listaId: string, token: string): Promise<Item[]> {
  const base = `https://graph.microsoft.com/v1.0/me/todo/lists/${encodeURIComponent(listaId)}/tasks`;
  const filtro = `$filter=${encodeURIComponent("status ne 'completed'")}&$top=100`;
  try {
    return await todas(`${base}?${filtro}&$expand=checklistItems`, token);
  } catch (e) {
    // Se a Microsoft não aceitar trazer os itens da checklist junto, vem sem eles
    if ((e as { status?: number }).status === 400) return await todas(`${base}?${filtro}`, token);
    throw e;
  }
}

const dataBr = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Manaus' }) : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const usuario = await usuarioDaRequisicao(req);
    if (!usuario) return json({ erro: 'Sessão do Tarefeiro inválida' }, 401);

    const db = servidor();
    const { data: conta } = await db.from('email_contas').select('id')
      .eq('user_id', usuario.id).eq('provedor', 'microsoft').order('created_at').limit(1).maybeSingle();
    if (!conta) return json({ erro: 'Conecte o Hotmail primeiro em Configurações → Sistemas.' });

    const { data: refresh } = await db.rpc('email_ler_token', { p_conta: conta.id });
    if (!refresh) return json({ erro: 'A conta Microsoft está sem acesso guardado: conecte o Hotmail de novo.', precisaAutorizar: true });

    let tokens;
    try {
      tokens = await pedirToken({ grant_type: 'refresh_token', refresh_token: String(refresh) }, ESCOPOS_TODO);
    } catch (e) {
      // Conexão feita antes de o Tarefeiro pedir o To Do: falta a pessoa autorizar
      if (/invalid_grant|invalid_scope|consent|AADSTS65001|AADSTS70000/i.test(mensagemDeErro(e))) {
        return json({ erro: 'Falta autorizar o To Do na Microsoft.', precisaAutorizar: true });
      }
      throw e;
    }
    if (tokens.refresh_token) await db.rpc('email_guardar_token', { p_conta: conta.id, p_token: tokens.refresh_token });

    const { data: areas } = await db.from('areas').select('id, name, sistema').eq('user_id', usuario.id).eq('archived', false);
    const listas = await todas('https://graph.microsoft.com/v1.0/me/todo/lists', tokens.access_token);

    const itens: Item[] = [];
    for (const lista of listas) {
      const areaId = areaDaLista(String(lista.displayName ?? ''), (areas ?? []) as Area[]);
      for (const t of await tarefasAbertas(lista.id, tokens.access_token)) {
        const corpo = String(t.body?.content ?? '').trim();
        itens.push({
          ref: t.id,
          aberto: true,
          titulo: t.title,
          descricao: [corpo, corpo ? '' : null, `Veio do To Do, lista "${lista.displayName}". Criada lá em ${dataBr(t.createdDateTime)}.`]
            .filter((l) => l !== null).join('\n'),
          // O To Do guarda o prazo como meia-noite local; no Brasil a data em UTC é a mesma
          prazo: t.dueDateTime?.dateTime ? String(t.dueDateTime.dateTime).slice(0, 10) : null,
          prioridade: t.importance === 'high' ? 'alta' : t.importance === 'low' ? 'baixa' : 'media',
          area_id: areaId,
          subtarefas: (t.checklistItems ?? []).map((c: Item) => ({
            id: c.id,
            title: c.displayName,
            completed: !!c.isChecked,
            createdAt: c.createdDateTime ?? new Date().toISOString(),
            comments: [],
          })),
        });
      }
    }

    // Grava como o próprio usuário: o RLS garante que só mexe nas tarefas dele
    const comoUsuario = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data, error } = await comoUsuario.rpc('espelhar_tarefas', { p_source: 'todo', p_itens: itens });
    if (error) throw new Error(`Não consegui gravar as tarefas: ${error.message}`);

    return json({ listas: listas.length, abertasNoToDo: itens.length, ...(data as object) });
  } catch (e) {
    return json({ erro: mensagemDeErro(e) }, 500);
  }
});
