import { create } from 'zustand';
import { Sistema } from '../types';
import { clienteDo, conectar, desconectar, listaSistemas } from '../lib/sistemas';
import { buscarBasePro, buscarNexo, ItemMonitorado } from '../lib/monitoramento';

interface EstadoSistema {
  email: string | null; // null = não conectado
  erro?: string;
  itens: ItemMonitorado[];
  atualizadoEm?: Date;
}

interface MonitoramentoState {
  sistemas: Record<Sistema, EstadoSistema>;
  carregando: boolean;
  carregar: () => Promise<void>;
  conectar: (sistema: Sistema, email: string, senha: string) => Promise<string | null>;
  desconectar: (sistema: Sistema) => Promise<void>;
}

const vazio = (): EstadoSistema => ({ email: null, itens: [] });

const buscadores = { basepro: buscarBasePro, nexo: buscarNexo };

async function lerSistema(sistema: Sistema): Promise<EstadoSistema> {
  const db = clienteDo(sistema);
  if (!db) return { ...vazio(), erro: 'Sistema não configurado neste ambiente.' };

  const { data } = await db.auth.getSession();
  const email = data.session?.user.email ?? null;
  if (!email) return vazio();

  try {
    const itens = await buscadores[sistema](db);
    return { email, itens, atualizadoEm: new Date() };
  } catch (e) {
    console.error(`Erro ao ler ${sistema}`, e);
    return { email, itens: [], erro: e instanceof Error ? e.message : String(e) };
  }
}

// Itens lidos ao vivo dos sistemas das empresas. Ficam só em memória: a fonte
// da verdade é o próprio BasePro/Nexo.
export const useMonitoramento = create<MonitoramentoState>((set, get) => ({
  sistemas: { basepro: vazio(), nexo: vazio() },
  carregando: false,

  carregar: async () => {
    if (get().carregando) return;
    set({ carregando: true });
    const resultados = await Promise.all(listaSistemas.map(lerSistema));
    set({
      sistemas: Object.fromEntries(listaSistemas.map((s, i) => [s, resultados[i]])) as Record<Sistema, EstadoSistema>,
      carregando: false,
    });
  },

  conectar: async (sistema, email, senha) => {
    const erro = await conectar(sistema, email, senha);
    if (!erro) {
      const estado = await lerSistema(sistema);
      set((s) => ({ sistemas: { ...s.sistemas, [sistema]: estado } }));
    }
    return erro;
  },

  desconectar: async (sistema) => {
    await desconectar(sistema);
    set((s) => ({ sistemas: { ...s.sistemas, [sistema]: vazio() } }));
  },
}));

export const itensExternos = (sistemas: Record<Sistema, EstadoSistema>): ItemMonitorado[] =>
  listaSistemas.flatMap((s) => sistemas[s].itens);
