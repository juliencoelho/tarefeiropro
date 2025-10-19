// Script para testar as tabelas criadas no Supabase
// Execute com: node scripts/test-database.js

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lista de tabelas esperadas
const expectedTables = [
  'users',
  'clients', 
  'tasks',
  'task_assignments',
  'subtasks',
  'comments',
  'attachments'
];

async function testTable(tableName) {
  try {
    console.log(`🔍 Testando tabela: ${tableName}`);
    
    // Tentar fazer uma consulta simples
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log(`  ❌ Erro: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ Tabela encontrada - ${count || 0} registros`);
    
    // Mostrar alguns dados se existirem
    if (data && data.length > 0) {
      console.log(`  📊 Primeiros registros:`);
      data.slice(0, 2).forEach((record, index) => {
        const keys = Object.keys(record).slice(0, 3);
        const preview = keys.map(key => `${key}: ${record[key]}`).join(', ');
        console.log(`    ${index + 1}. ${preview}...`);
      });
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro inesperado: ${error.message}`);
    return false;
  }
}

async function testRelationships() {
  console.log('\n🔗 Testando relacionamentos...');
  
  try {
    // Testar relacionamento tasks -> clients
    const { data: tasksWithClients, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        clients (
          id,
          name
        )
      `)
      .limit(3);
    
    if (tasksError) {
      console.log('  ❌ Erro ao testar relacionamento tasks -> clients:', tasksError.message);
    } else {
      console.log('  ✅ Relacionamento tasks -> clients funcionando');
      if (tasksWithClients && tasksWithClients.length > 0) {
        console.log(`  📊 Exemplo: Tarefa "${tasksWithClients[0].title}" do cliente "${tasksWithClients[0].clients?.name || 'N/A'}"`);
      }
    }
    
    // Testar relacionamento tasks -> task_assignments -> users
    const { data: tasksWithAssignments, error: assignmentsError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        task_assignments (
          users (
            id,
            name
          )
        )
      `)
      .limit(3);
    
    if (assignmentsError) {
      console.log('  ❌ Erro ao testar relacionamento tasks -> assignments -> users:', assignmentsError.message);
    } else {
      console.log('  ✅ Relacionamento tasks -> assignments -> users funcionando');
      if (tasksWithAssignments && tasksWithAssignments.length > 0) {
        const task = tasksWithAssignments[0];
        const assignedUsers = task.task_assignments?.length || 0;
        console.log(`  📊 Exemplo: Tarefa "${task.title}" tem ${assignedUsers} usuário(s) atribuído(s)`);
      }
    }
    
  } catch (error) {
    console.log('  ❌ Erro inesperado ao testar relacionamentos:', error.message);
  }
}

async function testRLS() {
  console.log('\n🔒 Testando Row Level Security (RLS)...');
  
  try {
    // Tentar inserir um usuário (deve falhar sem autenticação)
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: 'Teste RLS',
        email: 'teste@rls.com',
        role: 'user'
      });
    
    if (error) {
      console.log('  ✅ RLS funcionando - inserção bloqueada sem autenticação');
      console.log(`  📝 Erro esperado: ${error.message}`);
    } else {
      console.log('  ⚠️  RLS pode não estar configurado corretamente - inserção permitida');
    }
    
  } catch (error) {
    console.log('  ✅ RLS funcionando - erro ao tentar inserir:', error.message);
  }
}

async function generateSummary(results) {
  console.log('\n📋 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`📊 Tabelas testadas: ${successCount}/${totalCount}`);
  console.log('');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.table}`);
  });
  
  console.log('');
  
  if (successCount === totalCount) {
    console.log('🎉 SUCESSO! Todas as tabelas estão funcionando corretamente');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Atualizar o store para usar dados do Supabase');
    console.log('2. Implementar autenticação');
    console.log('3. Testar a aplicação completa');
  } else {
    console.log('⚠️  ATENÇÃO! Algumas tabelas não estão funcionando');
    console.log('');
    console.log('🔧 Ações recomendadas:');
    console.log('1. Verificar se todas as migrações foram executadas');
    console.log('2. Conferir erros no painel do Supabase');
    console.log('3. Executar novamente: npm run setup-db');
  }
}

async function main() {
  console.log('🧪 TESTE DO BANCO DE DADOS SUPABASE');
  console.log('='.repeat(50));
  console.log('');
  
  const results = [];
  
  // Testar cada tabela
  for (const table of expectedTables) {
    const success = await testTable(table);
    results.push({ table, success });
    console.log(''); // Linha em branco
  }
  
  // Testar relacionamentos
  await testRelationships();
  
  // Testar RLS
  await testRLS();
  
  // Gerar resumo
  await generateSummary(results);
}

main().catch(console.error);