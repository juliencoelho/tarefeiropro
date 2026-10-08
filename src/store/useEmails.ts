import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export type CategoriaEmail = 'acao' | 'informativo' | 'descartavel';

export interface ContaEmail {
  id: string;
  endereco: string;
  nome: string | null;
  ativa: boolean;
  ultimo_sync_em: string | null;
  ultimo_erro: string | null;
}

export interface Email {
  id: string;
  conta_id: string;
  de_nome: string | null;
  de_endereco: string | null;
  assunto: string | null;
  previa: string | null;
  recebido_em: string | null;
  lido: boolean | null;
  tem_anexos: boolean;
  anexos: { nome: string; tamanho: number }[];
  link_web: string | null;
  categoria: CategoriaEmail | null;
  motivo_categoria: string | null;
  categoria_manual: boolean;
  tarefa_id: string | null;
}

// Só os e-mails recentes da Entrada vão para a tela; o histórico completo fica no banco
const DIAS_NA_TELA = 30;
const CAMPOS =
  'id, conta_id, de_nome, de_endereco, assunto, previa, recebido_em, lido, tem_anexos, anexos, link_web, categoria, motivo_categoria, categoria_manual, tarefa_id';

interface EmailsState {
  contas: ContaEmail[];
  emails: Email[];
  carregado: boolean;
  atualizando: boolean;
  carregar: () => Promise<void>;
  ouvir: () => () => void;
  conectar: () => Promise<void>;
  atualizarAgora: () => Promise<void>;
  pausar: (contaId: string, ativa: boolean) => Promise<void>;
  mudarCategoria: (emailId: string, categoria: CategoriaEmail) => Promise<void>;
  marcarTarefa: (emailId: string, tarefaId: string) => Promise<void>;
  criarRegraRemetente: (remetente: string, categoria: CategoriaEmail) => Promise<void>;
  lerCorpo: (emailId: string) => Promise<string>;
}

const upsert = <T extends { id: string }>(lista: T[], item: T) =>
  lista.some((x) => x.id === item.id) ? lista.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [item, ...lista];

export const useEmails = create<EmailsState>((set, get) => ({
  contas: [],
  emails: [],
  carregado: false,
  atualizando: false,

  carregar: async () => {
    const desde = new Date(Date.now() - DIAS_NA_TELA * 24 * 60 * 60 * 1000).toISOString();
    const [contas, emails] = await Promise.all([
      supabase.from('email_contas').select('id, endereco, nome, ativa, ultimo_sync_em, ultimo_erro').order('created_at'),
      supabase.from('emails').select(CAMPOS)
        .eq('pasta', 'inbox').is('removido_em', null).gte('recebido_em', desde)
        .order('recebido_em', { ascending: false }).limit(500),
    ]);
    if (contas.error || emails.error) {
      console.error('Erro ao carregar e-mails', contas.error ?? emails.error);
      return;
    }
    set({ contas: contas.data as ContaEmail[], emails: emails.data as Email[], carregado: true });
  },

  // Tempo real: o robô grava no servidor e a tela acompanha
  ouvir: () => {
    const canal = supabase
      .channel('emails-do-usuario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, (payload) => {
        const linha = payload.new as Email & { pasta?: string; removido_em?: string | null };
        if (payload.eventType === 'DELETE') {
          set((s) => ({ emails: s.emails.filter((e) => e.id !== (payload.old as Email).id) }));
        } else if (linha.pasta === 'inbox' && !linha.removido_em) {
          set((s) => ({ emails: upsert(s.emails, linha).sort((a, b) => (b.recebido_em ?? '').localeCompare(a.recebido_em ?? '')) }));
        } else {
          set((s) => ({ emails: s.emails.filter((e) => e.id !== linha.id) }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_contas' }, () => {
        get().carregar();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  },

  conectar: async () => {
    const { data, error } = await supabase.functions.invoke('email-conectar', { body: {} });
    if (error || !data?.url) {
      toast.error(data?.erro ?? 'Não consegui iniciar a conexão com a Microsoft.');
      return;
    }
    window.location.assign(data.url);
  },

  atualizarAgora: async () => {
    set({ atualizando: true });
    const { data, error } = await supabase.functions.invoke('email-sync', { body: {} });
    set({ atualizando: false });
    if (error || data?.erro) {
      toast.error(data?.erro ?? 'Não consegui atualizar os e-mails.');
      return;
    }
    const comErro = (data?.resultados ?? []).find((r: { status: string }) => r.status === 'erro');
    if (comErro) toast.error(`Erro ao ler ${comErro.conta}: ${comErro.detalhe}`);
    else toast.success('E-mails atualizados');
    await get().carregar();
  },

  pausar: async (contaId, ativa) => {
    const { error } = await supabase.from('email_contas').update({ ativa }).eq('id', contaId);
    if (error) toast.error('Não consegui mudar a conta.');
    await get().carregar();
  },

  mudarCategoria: async (emailId, categoria) => {
    set((s) => ({ emails: s.emails.map((e) => (e.id === emailId ? { ...e, categoria, categoria_manual: true } : e)) }));
    const { error } = await supabase.from('emails')
      .update({ categoria, categoria_manual: true, motivo_categoria: 'corrigido por você' }).eq('id', emailId);
    if (error) toast.error('Não consegui salvar a categoria.');
  },

  marcarTarefa: async (emailId, tarefaId) => {
    set((s) => ({ emails: s.emails.map((e) => (e.id === emailId ? { ...e, tarefa_id: tarefaId } : e)) }));
    await supabase.from('emails').update({ tarefa_id: tarefaId }).eq('id', emailId);
  },

  criarRegraRemetente: async (remetente, categoria) => {
    const { error } = await supabase.from('email_regras')
      .upsert({ tipo: 'remetente', valor: remetente.toLowerCase(), categoria, ativa: true }, { onConflict: 'user_id,tipo,valor' });
    if (error) toast.error('Não consegui criar a regra.');
    else toast.success(`Próximos e-mails de ${remetente} já entram assim`);
  },

  lerCorpo: async (emailId) => {
    const { data } = await supabase.from('email_corpos').select('texto').eq('email_id', emailId).maybeSingle();
    return data?.texto ?? '';
  },
}));
