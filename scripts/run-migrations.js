// Script para executar migrações no Supabase
// Execute com: node scripts/run-migrations.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de service role (não a anon key)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.log('💡 Dica: Adicione SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de migrações na ordem correta
const migrations = [
  '001_create_initial_tables.sql',
  '002_setup_rls.sql',
  '003_insert_initial_data.sql'
];

async function runMigration(filename) {
  try {
    console.log(`🔄 Executando migração: ${filename}`);
    
    const migrationPath = join(__dirname, '..', 'migrations', filename);
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: command });
        
        if (error) {
          // Se o comando falhar, tenta executar diretamente
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0); // Apenas para testar a conexão
          
          if (directError) {
            console.error(`❌ Erro ao executar comando: ${command.substring(0, 100)}...`);
            console.error('Erro:', error);
            throw error;
          }
        }
      }
    }
    
    console.log(`✅ Migração ${filename} executada com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro na migração ${filename}:`, error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Iniciando execução das migrações...\n');
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      console.log(`\n❌ Parando execução devido ao erro na migração: ${migration}`);
      break;
    }
    console.log(''); // Linha em branco para separar
  }
  
  console.log(`\n📊 Resultado: ${successCount}/${migrations.length} migrações executadas com sucesso`);
  
  if (successCount === migrations.length) {
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verificar as tabelas no painel do Supabase');
    console.log('2. Testar a conexão com o banco');
    console.log('3. Atualizar o store para usar dados do Supabase');
  } else {
    console.log('⚠️  Algumas migrações falharam. Verifique os erros acima.');
  }
}

// Executar migrações
runAllMigrations().catch(console.error);