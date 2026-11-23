import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { itensExternos, useMonitoramento } from '../store/useMonitoramento';
import { combinar, paraCobrarAgora, unificarNotas } from '../lib/monitoramento';
import { hojeStr } from '../lib/tarefas';

// Itens dos sistemas + anotações e itens manuais do Tarefeiro. A mesma NF a entregar
// e a receber vira uma linha só. `cobrar` é o que vence agora (tela Hoje e o número
// do menu); `grupos.atencao` é o mesmo `cobrar.agora`, mantido para o menu lateral.
export function useItensMonitorados() {
  const sistemas = useMonitoramento((s) => s.sistemas);
  const monitoringItems = useAppStore((s) => s.monitoringItems);

  return useMemo(() => {
    const { ativos, dispensados } = combinar(itensExternos(sistemas), monitoringItems);
    const unificados = unificarNotas(ativos);
    const cobrar = paraCobrarAgora(unificados, hojeStr());
    return { ativos: unificados, dispensados, cobrar, grupos: { atencao: cobrar.agora } };
  }, [sistemas, monitoringItems]);
}

const CINCO_MINUTOS = 5 * 60 * 1000;

// Mantém os dados dos sistemas atualizados: ao abrir, a cada 5 minutos e ao voltar para a aba
export function useAtualizarMonitoramento() {
  const carregar = useMonitoramento((s) => s.carregar);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, CINCO_MINUTOS);
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') carregar();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [carregar]);
}
