import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não encontradas. Verifique o arquivo .env')
}

// Cliente Supabase configurado
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para testar a conexão
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não encontrada (esperado)
      throw error
    }
    return { success: true, message: 'Conexão com Supabase estabelecida com sucesso!' }
  } catch (error) {
    return { success: false, message: `Erro na conexão: ${error}` }
  }
}