// Script simplificado para configurar o banco de dados
// Execute com: node scripts/setup-database.js

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o Supabase...');
    
    // Tenta fazer uma consulta simples
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && (error.code === 'PGRST116' || error.message.includes('Could not find the table'))) {
      console.log('ℹ️  Tabela "users" não existe ainda - isso é esperado antes das migrações');
      return true;
    } else if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    } else {
      console.log('✅ Conexão com Supabase estabelecida com sucesso');
      console.log('ℹ️  Tabelas já existem - migrações podem já ter sido executadas');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
    return false;
  }
}

async function checkTables() {
  console.log('\n🔍 Verificando tabelas existentes...');
  
  const tables = ['users', 'clients', 'tasks', 'task_assignments', 'subtasks', 'comments', 'attachments'];
  const existingTables = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
      }
    } catch (error) {
      // Tabela não existe
    }
  }
  
  if (existingTables.length > 0) {
    console.log(`✅ Tabelas encontradas: ${existingTables.join(', ')}`);
  } else {
    console.log('ℹ️  Nenhuma tabela encontrada - execute as migrações manualmente');
  }
  
  return existingTables;
}

async function showMigrationInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA EXECUTAR AS MIGRAÇÕES:');
  console.log('');
  console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto');
  console.log('3. Vá para "SQL Editor" no menu lateral');
  console.log('4. Execute os arquivos de migração na seguinte ordem:');
  console.log('');
  console.log('   📄 migrations/001_create_initial_tables.sql');
  console.log('   📄 migrations/002_setup_rls.sql');
  console.log('   📄 migrations/003_insert_initial_data.sql');
  console.log('');
  console.log('5. Copie e cole o conteúdo de cada arquivo no SQL Editor');
  console.log('6. Execute cada migração clicando em "Run"');
  console.log('');
  console.log('💡 Dica: Execute uma migração por vez e verifique se não há erros');
}

async function main() {
  console.log('🚀 Configuração do banco de dados Supabase\n');
  
  // Testar conexão
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Não foi possível conectar ao Supabase');
    console.log('Verifique suas credenciais no arquivo .env');
    return;
  }
  
  // Verificar tabelas
  const existingTables = await checkTables();
  
  if (existingTables.length === 0) {
    // Mostrar instruções para executar migrações
    showMigrationInstructions();
  } else if (existingTables.length < 7) {
    console.log('\n⚠️  Algumas tabelas estão faltando');
    console.log('Execute as migrações restantes no painel do Supabase');
    showMigrationInstructions();
  } else {
    console.log('\n🎉 Todas as tabelas parecem estar configuradas!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verificar dados no painel do Supabase');
    console.log('2. Atualizar o store para usar dados do Supabase');
    console.log('3. Testar a aplicação');
  }
}

main().catch(console.error);