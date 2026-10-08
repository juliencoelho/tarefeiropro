// Retorno do login da Microsoft: troca o código por tokens, guarda o refresh token no Vault,
// registra a conta e dispara a primeira leitura. Sempre devolve o usuário para o app.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { APP_URL, URL_FUNCOES, URL_RETORNO, mensagemDeErro, pedirToken, servidor } from '../_shared/microsoft.ts';

const VALIDADE_PEDIDO_MS = 15 * 60 * 1000;

const voltar = (params: Record<string, string>) =>
  Response.redirect(`${APP_URL}/configuracoes?${new URLSearchParams({ aba: 'sistemas', ...params })}`, 302);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const erroMicrosoft = url.searchParams.get('error');
  if (erroMicrosoft) {
    const motivo = url.searchParams.get('error_description') ?? erroMicrosoft;
    return voltar({ email: 'erro', motivo: motivo.split(/\r?\n/)[0].slice(0, 150) });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return voltar({ email: 'erro', motivo: 'Retorno da Microsoft incompleto' });

  try {
    const db = servidor();
    const { data: pedido } = await db.from('email_oauth_estados').select('user_id, created_at').eq('state', state).maybeSingle();
    await db.from('email_oauth_estados').delete().eq('state', state);
    if (!pedido || Date.now() - new Date(pedido.created_at).getTime() > VALIDADE_PEDIDO_MS) {
      return voltar({ email: 'erro', motivo: 'O pedido de conexão expirou. Tente de novo.' });
    }

    const tokens = await pedirToken({ grant_type: 'authorization_code', code, redirect_uri: URL_RETORNO });
    if (!tokens.refresh_token) throw new Error('A Microsoft não devolveu acesso contínuo (offline_access)');

    const perfil = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json());
    const endereco = String(perfil.mail ?? perfil.userPrincipalName ?? '').toLowerCase();
    if (!endereco) throw new Error('Não consegui ler o endereço da conta Microsoft');

    const { data: conta, error } = await db
      .from('email_contas')
      .upsert(
        { user_id: pedido.user_id, provedor: 'microsoft', endereco, nome: perfil.displayName ?? null, ativa: true, ultimo_erro: null },
        { onConflict: 'user_id,provedor,endereco' }
      )
      .select('id')
      .single();
    if (error || !conta) throw new Error(`Não consegui registrar a conta: ${error?.message}`);

    const { error: erroToken } = await db.rpc('email_guardar_token', { p_conta: conta.id, p_token: tokens.refresh_token });
    if (erroToken) throw new Error(`Não consegui guardar o acesso no cofre: ${erroToken.message}`);

    // Primeira leitura em segundo plano, sem segurar o usuário na tela
    const { data: chave } = await db.rpc('email_chave_sync');
    EdgeRuntime.waitUntil(
      fetch(`${URL_FUNCOES}/email-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sync-key': String(chave ?? '') },
        body: JSON.stringify({ conta_id: conta.id }),
      }).catch(() => undefined)
    );

    return voltar({ email: 'conectado' });
  } catch (e) {
    return voltar({ email: 'erro', motivo: mensagemDeErro(e).slice(0, 150) });
  }
});
