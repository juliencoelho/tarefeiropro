// Configurações da aplicação
export const appConfig = {
  // Modo de desenvolvimento - usar dados mock em vez do Supabase
  useMockData: true,
  
  // Configurações do Supabase (para uso futuro)
  supabase: {
    enabled: false,
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Configurações de desenvolvimento
  development: {
    showDebugInfo: true,
    enableConsoleLogging: true,
  },
  
  // Configurações da aplicação
  app: {
    name: 'Tarefeiro Pro',
    version: '1.0.0',
    description: 'Sistema de gestão de tarefas e projetos',
  }
};

// Função para verificar se deve usar dados mock
export const shouldUseMockData = () => {
  return appConfig.useMockData || !appConfig.supabase.enabled;
};

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(appConfig.supabase.url && appConfig.supabase.anonKey);
};