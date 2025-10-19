# Configuração do Banco de Dados - Tarefeiro Pro

Este documento descreve como configurar o banco de dados Supabase para o projeto Tarefeiro Pro.

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais configuradas no arquivo `.env`

## 🚀 Configuração Inicial

### 1. Verificar Conexão

Execute o comando para verificar se a conexão com o Supabase está funcionando:

```bash
npm run setup-db
```

Este comando irá:
- Testar a conexão com o Supabase
- Verificar quais tabelas já existem
- Mostrar instruções para executar as migrações

### 2. Executar Migrações

As migrações devem ser executadas **na ordem correta** no painel do Supabase:

#### 📄 Migração 1: `migrations/001_create_initial_tables.sql`
- Cria todas as tabelas principais
- Define estrutura de dados
- Configura relacionamentos e constraints

#### 📄 Migração 2: `migrations/002_setup_rls.sql`
- Habilita Row Level Security (RLS)
- Define políticas de acesso
- Configura permissões por usuário

#### 📄 Migração 3: `migrations/003_insert_initial_data.sql`
- Insere dados iniciais de exemplo
- Cria usuários de teste
- Adiciona clientes e tarefas de exemplo

## 🔧 Como Executar as Migrações

### Opção 1: Painel do Supabase (Recomendado)

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **"SQL Editor"** no menu lateral
4. Para cada arquivo de migração:
   - Abra o arquivo no seu editor de código
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"**
   - Verifique se não há erros

### Opção 2: CLI do Supabase (Avançado)

Se você tem o CLI do Supabase instalado:

```bash
# Instalar CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Executar migrações
supabase db push
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **`users`** - Usuários do sistema
- **`clients`** - Clientes/empresas
- **`tasks`** - Tarefas principais
- **`task_assignments`** - Atribuições de tarefas
- **`subtasks`** - Subtarefas
- **`comments`** - Comentários em tarefas
- **`attachments`** - Anexos de tarefas

### Relacionamentos

```
users (1) ←→ (N) tasks (created_by)
users (1) ←→ (N) task_assignments
clients (1) ←→ (N) tasks
tasks (1) ←→ (N) subtasks
tasks (1) ←→ (N) comments
tasks (1) ←→ (N) attachments
```

## 🔒 Segurança (RLS)

O Row Level Security está configurado para:

- **Usuários**: Podem ver todos, mas só editam o próprio perfil
- **Clientes**: Todos podem ver/editar, só admins podem deletar
- **Tarefas**: Usuários veem tarefas públicas ou atribuídas a eles
- **Comentários**: Só podem editar/deletar próprios comentários
- **Anexos**: Só podem deletar próprios anexos

## 🧪 Dados de Teste

Após executar as migrações, você terá:

### Usuários de Teste
- João Silva (admin)
- Maria Santos (manager)
- Pedro Costa (user)
- Ana Oliveira (user)
- Carlos Ferreira (user)

### Clientes de Exemplo
- TechCorp Ltda
- Inovação Digital
- StartupXYZ
- Consultoria ABC
- E-commerce Plus

### Tarefas de Exemplo
- Desenvolver landing page (em progresso)
- Reunião de planejamento (pendente)
- Configurar ambiente de produção (concluída)

## ✅ Verificação

Após executar todas as migrações:

1. Execute novamente: `npm run setup-db`
2. Verifique se todas as 7 tabelas foram criadas
3. Acesse o painel do Supabase para ver os dados
4. Teste a aplicação para verificar se está funcionando

## 🚨 Solução de Problemas

### Erro de Conexão
- Verifique as credenciais no arquivo `.env`
- Confirme se o projeto está ativo no Supabase

### Erro de Permissão
- Verifique se está usando a chave correta (anon key)
- Confirme se o RLS está configurado corretamente

### Tabelas Não Criadas
- Execute as migrações uma por vez
- Verifique erros no SQL Editor
- Confirme a ordem de execução

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no painel do Supabase
2. Execute `npm run setup-db` para diagnóstico
3. Consulte a documentação do Supabase