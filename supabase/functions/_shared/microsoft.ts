// Conversa com a Microsoft (login OAuth e Graph) e cliente do Supabase com acesso de servidor.
// Credenciais do app vêm dos secrets MS_CLIENT_ID e MS_CLIENT_SECRET, cadastrados pelo Julien.
import { createClient } from 'npm:@supabase/supabase-js@2';

// Conta pessoal (Hotmail/Outlook.com) entra pelo endpoint /consumers
export const AUTORIDADE = Deno.env.get('MS_AUTHORITY') ?? 'consumers';
export const ESCOPOS = 'offline_access openid email User.Read Mail.ReadWrite';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
export const URL_FUNCOES = `${SUPABASE_URL}/functions/v1`;
export const URL_RETORNO = `${URL_FUNCOES}/email-oauth-callback`;
export const APP_URL = Deno.env.get('APP_URL') ?? 'https://tarefeiropro.vercel.app';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

export function servidor() {
  const chave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente no ambiente da função');
  return createClient(SUPABASE_URL, chave, { auth: { persistSession: false } });
}

export function credenciais() {
  const clientId = Deno.env.get('MS_CLIENT_ID');
  const segredo = Deno.env.get('MS_CLIENT_SECRET');
  if (!clientId || !segredo) {
    throw new Error('Faltam os secrets MS_CLIENT_ID e/ou MS_CLIENT_SECRET (Supabase → Edge Functions → Secrets)');
  }
  return { clientId, segredo };
}

// Usuário do Tarefeiro a partir do token da sessão enviado pelo app
export async function usuarioDaRequisicao(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await servidor().auth.getUser(token);
  return data.user ?? null;
}

interface RespostaToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

// Erros trazem só o código e a primeira linha da descrição da Microsoft: nunca tokens
export async function pedirToken(params: Record<string, string>): Promise<RespostaToken> {
  const { clientId, segredo } = credenciais();
  const res = await fetch(`https://login.microsoftonline.com/${AUTORIDADE}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: segredo, scope: ESCOPOS, ...params }),
  });
  const corpo = await res.json().catch(() => ({}));
  if (!res.ok) {
    const descricao = String(corpo.error_description ?? '').split(/\r?\n/)[0].slice(0, 200);
    throw new Error(`Microsoft recusou o token (${res.status} ${corpo.error ?? ''}): ${descricao}`);
  }
  return corpo as RespostaToken;
}

export function mensagemDeErro(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).slice(0, 500);
}
