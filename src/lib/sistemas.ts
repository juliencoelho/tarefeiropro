// Conexão com os sistemas das empresas. O Tarefeiro entra em cada um com o login
// do próprio usuário e lê/escreve com as permissões (RLS) que ele já tem lá:
// nenhuma chave com acesso total fica guardada aqui.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Sistema } from '../types';

interface ConfigSistema {
  nome: string;
  url?: string;
  chave?: string;
}

export const configSistemas: Record<Sistema, ConfigSistema> = {
  basepro: {
    nome: 'BasePro',
    url: import.meta.env.VITE_BASEPRO_URL,
    chave: import.meta.env.VITE_BASEPRO_ANON_KEY,
  },
  nexo: {
    nome: 'Nexo',
    url: import.meta.env.VITE_NEXO_URL,
    chave: import.meta.env.VITE_NEXO_ANON_KEY,
  },
};

export const listaSistemas: Sistema[] = ['basepro', 'nexo'];

const clientes: Partial<Record<Sistema, SupabaseClient>> = {};

// Um cliente por sistema, com a sessão guardada separada da sessão do Tarefeiro
export function clienteDo(sistema: Sistema): SupabaseClient | null {
  const { url, chave } = configSistemas[sistema];
  if (!url || !chave) return null;
  clientes[sistema] ??= createClient(url, chave, {
    auth: {
      storageKey: `tarefeiro-sessao-${sistema}`,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return clientes[sistema]!;
}

export async function emailConectado(sistema: Sistema): Promise<string | null> {
  const db = clienteDo(sistema);
  if (!db) return null;
  const { data } = await db.auth.getSession();
  return data.session?.user.email ?? null;
}

// Retorna a mensagem de erro, ou null se conectou
export async function conectar(sistema: Sistema, email: string, senha: string): Promise<string | null> {
  const db = clienteDo(sistema);
  if (!db) return `${configSistemas[sistema].nome} não está configurado neste ambiente.`;
  const { error } = await db.auth.signInWithPassword({ email, password: senha });
  if (!error) return null;
  if (error.message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  return `Não foi possível conectar: ${error.message}`;
}

export async function desconectar(sistema: Sistema): Promise<void> {
  await clienteDo(sistema)?.auth.signOut({ scope: 'local' });
}
