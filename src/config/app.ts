// Configurações da aplicação
export const appConfig = {
  app: {
    name: 'Tarefeiro Pro',
    version: '1.0.0',
    description: 'Central de tarefas, compromissos e monitoramento',
  },

  features: {
    // Gestão de usuários (convites, aprovações, relatórios) fica no código,
    // mas fora do menu enquanto o sistema for de uso pessoal.
    gestaoUsuarios: false,
  },
};
