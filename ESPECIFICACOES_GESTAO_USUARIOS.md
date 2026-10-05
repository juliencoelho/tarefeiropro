# 👥 Especificações de Gestão de Usuários - Tarefeiro Pro

> **Documento Norte**: Especificações definidas pelo cliente para orientar o desenvolvimento do sistema de gestão de usuários, considerando compatibilidade total com Supabase.

## 🎯 Visão Geral

Sistema completo de gestão de usuários integrado às configurações do Tarefeiro Pro, preparado para migração futura ao Supabase Auth e funcionalidades relacionadas.

---

## 📋 1. CRUD de Usuários

### ✅ **Funcionalidades Básicas**
- **Adicionar novos usuários**
  - Formulário completo de cadastro
  - Validação de email único
  - Definição de papel (admin/user)
  - Upload de avatar opcional

- **Editar dados de qualquer usuário**
  - Modal de edição com todos os campos
  - Validações em tempo real
  - Histórico de alterações
  - Permissões baseadas em papel

- **Remover usuários**
  - Confirmação de exclusão
  - Verificação de dependências (tarefas atribuídas)
  - Soft delete para auditoria
  - Transferência de tarefas para outro usuário

- **Listar todos os usuários**
  - Visualização em cards e tabela
  - Paginação eficiente
  - Ordenação por múltiplos campos
  - Busca avançada

### 🔗 **Compatibilidade Supabase**
- **Auth Integration**: Usuários criados via Supabase Auth
- **RLS**: Row Level Security para controle de acesso
- **Triggers**: Sincronização automática entre auth.users e tabela customizada
- **Storage**: Upload de avatars via Supabase Storage

---

## 🎨 2. Interface de Usuário

### 📄 **Página de Gestão de Usuários**
- **Localização**: Configurações > Gestão de Usuários
- **Layout**: Grid responsivo com sidebar de filtros
- **Ações**: Adicionar, editar, remover, filtrar, buscar
- **Permissões**: Apenas administradores têm acesso completo

### 🃏 **Cards de Usuário**
```
┌─────────────────────────────────┐
│ [Avatar] João Silva        [⋮]  │
│ joao@empresa.com               │
│ 🟢 Online • Admin              │
│ 📊 15 tarefas ativas           │
│ 📅 Último login: hoje 14:30   │
└─────────────────────────────────┘
```

### 🔧 **Modal de Edição de Perfil**
- **Campos**: Nome, email, telefone, bio, papel, avatar
- **Validações**: Email único, campos obrigatórios
- **Ações**: Salvar, cancelar, redefinir senha
- **Histórico**: Log de alterações recentes

### 🔍 **Filtros e Busca**
- **Filtros Rápidos**: Online, Offline, Admin, User, Ativos, Inativos
- **Busca**: Nome, email, telefone (busca inteligente)
- **Ordenação**: Nome, email, último login, data criação
- **Período**: Filtro por data de criação/último acesso

### 🎨 **Design System**
- **Cores**: Paleta em tons de cinza com acentos
- **Ícones**: Status online/offline, papéis, ações
- **Responsividade**: Mobile-first design
- **Acessibilidade**: WCAG AA compliance

---

## ⚙️ 3. Funcionalidades Avançadas

### 📧 **Sistema de Convites por Email**
- **Fluxo**: Admin envia convite → Email com link → Usuário aceita → Conta criada
- **Template**: Email personalizado com branding
- **Expiração**: Links com validade de 7 dias
- **Reenvio**: Possibilidade de reenviar convites
- **Supabase**: Utiliza `auth.invite()` nativo

### ✅ **Sistema de Aprovação de Usuários**
- **Fluxo**: Cadastro → Pendente → Admin aprova/rejeita → Ativo/Rejeitado
- **Notificações**: Admin recebe notificação de novos cadastros
- **Dashboard**: Painel de aprovações pendentes
- **Histórico**: Log de aprovações/rejeições
- **Supabase**: Campo `approved` + RLS policies

### 📊 **Relatórios de Produtividade**
- **Métricas**: Tarefas concluídas, tempo médio, eficiência
- **Período**: Diário, semanal, mensal, customizado
- **Visualização**: Gráficos e tabelas interativas
- **Exportação**: PDF, Excel, CSV
- **Supabase**: Views e functions para agregações

### 🟢 **Status Online e Último Login**
- **Online**: Indicador em tempo real (heartbeat a cada 30s)
- **Último Login**: Data/hora da última atividade
- **Histórico**: Log de sessões e atividades
- **Timeout**: Offline após 5 minutos de inatividade
- **Supabase**: Tabela `user_sessions` + Realtime

### 🔔 **Sistema de Notificações**
- **Tipos**: Menções, atribuições, comentários, aprovações
- **Canais**: In-app, email, push (futuro)
- **Preferências**: Configurável por usuário
- **Tempo Real**: Via Supabase Realtime
- **Histórico**: Notificações lidas/não lidas

### ⚙️ **Preferências de Notificação**
```
┌─ Preferências de Notificação ─┐
│ ☑️ Novas tarefas atribuídas    │
│ ☑️ Comentários em tarefas      │
│ ☑️ Menções (@usuário)          │
│ ☐ Relatórios semanais         │
│ ☑️ Aprovações pendentes        │
│ ☐ Atualizações do sistema     │
└────────────────────────────────┘
```

### 💬 **Sistema de Menções**
- **Sintaxe**: @nomedousuario ou @email
- **Autocomplete**: Busca inteligente durante digitação
- **Notificação**: Usuário mencionado recebe notificação
- **Contexto**: Link direto para tarefa/comentário
- **Supabase**: Parsing no frontend + notificação via trigger

---

## 🗄️ 4. Estrutura de Dados (Preparação Supabase)

### 👤 **Tabela: user_profiles**
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  is_online BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 📧 **Tabela: user_invites**
```sql
CREATE TABLE user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 🔔 **Tabela: notifications**
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ⚙️ **Tabela: user_preferences**
```sql
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT true,
  mention_notifications BOOLEAN DEFAULT true,
  task_notifications BOOLEAN DEFAULT true,
  report_notifications BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'pt-BR'
);
```

---

## 🔐 5. Segurança e Permissões

### 🛡️ **Row Level Security (RLS)**
- **user_profiles**: Usuários veem apenas próprio perfil, admins veem todos
- **notifications**: Usuários veem apenas próprias notificações
- **user_invites**: Apenas admins podem gerenciar convites
- **user_preferences**: Apenas próprio usuário pode editar

### 👑 **Hierarquia de Papéis**
- **Admin**: Acesso total ao sistema
- **User**: Acesso limitado às próprias informações

### 🔒 **Validações de Segurança**
- **Email único**: Verificação em tempo real
- **Senhas fortes**: Política de senhas do Supabase
- **Rate limiting**: Proteção contra spam
- **Auditoria**: Log de todas as ações sensíveis

---

## 📱 6. Experiência do Usuário (UX)

### 🎯 **Princípios de Design**
- **Simplicidade**: Interface limpa e intuitiva
- **Consistência**: Padrões visuais unificados
- **Feedback**: Confirmações e estados de loading
- **Acessibilidade**: Navegação por teclado e screen readers

### 🚀 **Performance**
- **Paginação**: Máximo 20 usuários por página
- **Cache**: Dados frequentes em cache local
- **Lazy Loading**: Avatars carregados sob demanda
- **Otimização**: Queries eficientes no Supabase

### 📱 **Responsividade**
- **Mobile**: Cards empilhados, menu hambúrguer
- **Tablet**: Grid 2 colunas, sidebar colapsável
- **Desktop**: Grid 3-4 colunas, sidebar fixa

---

## 🔄 7. Migração para Supabase

### 📋 **Checklist de Migração**
- [ ] Configurar Supabase Auth
- [ ] Criar tabelas e RLS policies
- [ ] Migrar dados de usuários existentes
- [ ] Configurar Storage para avatars
- [ ] Implementar Realtime subscriptions
- [ ] Configurar Edge Functions para lógica complexa
- [ ] Testar sistema de convites
- [ ] Validar notificações em tempo real

### 🔧 **Configurações Necessárias**
- **Auth Providers**: Email, Google (opcional)
- **Storage Buckets**: `avatars` (público)
- **Realtime**: Habilitado para todas as tabelas
- **Edge Functions**: Processamento de convites e notificações

---

## 📈 8. Métricas e Monitoramento

### 📊 **KPIs do Sistema**
- **Usuários ativos**: Diário, semanal, mensal
- **Taxa de aprovação**: % de usuários aprovados
- **Tempo de resposta**: Convites aceitos
- **Engajamento**: Notificações lidas/clicadas

### 🔍 **Logs e Auditoria**
- **Ações de usuário**: Login, logout, alterações
- **Ações de admin**: Aprovações, convites, edições
- **Erros**: Falhas de autenticação, validações
- **Performance**: Tempo de carregamento, queries

---

## 🎯 Conclusão

Este documento serve como **norte** para o desenvolvimento do sistema de gestão de usuários do Tarefeiro Pro, garantindo:

✅ **Compatibilidade total com Supabase**  
✅ **Experiência de usuário excepcional**  
✅ **Segurança e performance**  
✅ **Escalabilidade futura**  
✅ **Manutenibilidade do código**

**Próximos passos**: Implementação incremental seguindo as prioridades definidas no plano de desenvolvimento.