// Gera o link de login da Microsoft para conectar a caixa de e-mail.
// Chamado pelo app com a sessão do usuário; o retorno cai em email-oauth-callback.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { AUTORIDADE, ESCOPOS, URL_RETORNO, cors, credenciais, json, mensagemDeErro, servidor, usuarioDaRequisicao } from '../_shared/microsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const usuario = await usuarioDaRequisicao(req);
    if (!usuario) return json({ erro: 'Sessão do Tarefeiro inválida' }, 401);

    const { clientId } = credenciais();
    const state = crypto.randomUUID() + crypto.randomUUID();
    const { error } = await servidor().from('email_oauth_estados').insert({ state, user_id: usuario.id });
    if (error) throw new Error(`Não consegui registrar o pedido: ${error.message}`);

    const url = new URL(`https://login.microsoftonline.com/${AUTORIDADE}/oauth2/v2.0/authorize`);
    url.search = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: URL_RETORNO,
      response_mode: 'query',
      scope: ESCOPOS,
      state,
      prompt: 'select_account',
    }).toString();

    return json({ url: url.toString() });
  } catch (e) {
    return json({ erro: mensagemDeErro(e) }, 500);
  }
});
