-- Tarefeiro Pro — schema inicial (etapa 1)
-- Toda linha tem dono (user_id). O Cowork grava via SQL direto e precisa informar user_id.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ Cadastro por convite ============
create table public.allowed_signups (
  email text primary key,
  created_at timestamptz not null default now()
);
comment on table public.allowed_signups is 'E-mails autorizados a criar conta. Cadastro de qualquer outro e-mail é bloqueado.';
alter table public.allowed_signups enable row level security;
revoke all on public.allowed_signups from anon, authenticated;

-- ============ Perfis ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  avatar text,
  phone text,
  bio text,
  role text not null default 'admin' check (role in ('admin', 'user')),
  preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Perfil de cada usuário (1:1 com auth.users).';

-- ============ Áreas ============
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  icon text,
  position integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.areas is 'Frentes da vida do usuário (ex.: BasePro, Nexo, Pessoal). Criadas livremente pelo usuário.';
comment on column public.areas.position is 'Ordem de exibição na barra lateral (menor primeiro).';

-- ============ Clientes e contatos ============
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  name text not null,
  company text,
  email text,
  phone text,
  color text not null default '#3b82f6',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.clients is 'Clientes (empresas ou pessoas) aos quais tarefas, compromissos e itens de monitoramento podem ser vinculados.';

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.contacts is 'Pessoas de contato dentro de um cliente.';
comment on column public.contacts.role is 'Cargo ou função da pessoa no cliente.';

-- ============ Tarefas e compromissos ============
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'para_fazer'
    check (status in ('para_fazer', 'fazendo', 'aguardando_retorno', 'feito', 'longo_prazo')),
  priority text not null default 'media'
    check (priority in ('baixa', 'media', 'alta', 'urgente')),
  type text not null default 'tarefa' check (type in ('tarefa', 'evento')),
  due_date date,
  start_time time,
  end_time time,
  original_due_date date,
  extension_count integer not null default 0,
  last_extension_date timestamptz,
  extension_reason text,
  planned_for date,
  in_inbox boolean not null default false,
  source text not null default 'app' check (source in ('app', 'cowork')),
  is_visible_to_all boolean not null default true,
  tags text[] not null default '{}',
  subtasks jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  assigned_to jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tasks is 'Tarefas (type=tarefa) e compromissos com horário (type=evento).';
comment on column public.tasks.status is 'para_fazer | fazendo | aguardando_retorno | feito | longo_prazo';
comment on column public.tasks.priority is 'baixa | media | alta | urgente';
comment on column public.tasks.type is 'tarefa = algo a fazer; evento = compromisso com data e horário (start_time/end_time).';
comment on column public.tasks.due_date is 'Prazo (tarefa) ou dia do compromisso (evento).';
comment on column public.tasks.original_due_date is 'Prazo original, antes de prorrogações.';
comment on column public.tasks.extension_count is 'Quantas vezes o prazo foi prorrogado.';
comment on column public.tasks.planned_for is 'Dia em que o usuário planejou fazer a tarefa (tela Hoje). Diferente do prazo.';
comment on column public.tasks.in_inbox is 'true = ainda na caixa de entrada, sem triagem.';
comment on column public.tasks.source is 'Quem criou: app (usuário pela tela) ou cowork (assistente).';
comment on column public.tasks.subtasks is 'Lista JSON: [{id, title, completed, createdAt, comments, comment?}]';
comment on column public.tasks.comments is 'Lista JSON: [{id, content, author{id,name,email,role}, createdAt, mentions}]';

-- ============ Monitoramento ============
create table public.monitoring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  kind text not null check (kind in ('aguardando_retorno', 'nf_transito', 'conta_receber', 'empenho')),
  title text not null,
  reference text,
  amount numeric(14, 2),
  expected_date date,
  follow_up_on date,
  status text not null default 'aberto' check (status in ('aberto', 'resolvido', 'cancelado')),
  resolved_at timestamptz,
  notes text,
  source text not null default 'app' check (source in ('app', 'cowork')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.monitoring_items is 'Coisas que não dependem do usuário, mas que ele precisa acompanhar e cobrar.';
comment on column public.monitoring_items.kind is 'aguardando_retorno = resposta/aprovação de alguém; nf_transito = nota fiscal/entrega a caminho; conta_receber = valor a receber; empenho = empenho de órgão público em andamento.';
comment on column public.monitoring_items.reference is 'Identificador externo: número da NF, do empenho, do pedido etc.';
comment on column public.monitoring_items.amount is 'Valor em reais: valor a receber (conta_receber), valor da NF (nf_transito) ou valor empenhado (empenho).';
comment on column public.monitoring_items.expected_date is 'Data prevista: entrega da NF, vencimento do recebimento, previsão de pagamento do empenho.';
comment on column public.monitoring_items.follow_up_on is 'Data em que o usuário deve cobrar/verificar o item.';

-- ============ Índices ============
create index areas_user_id_idx on public.areas (user_id);
create index clients_user_id_idx on public.clients (user_id);
create index clients_area_id_idx on public.clients (area_id);
create index contacts_user_id_idx on public.contacts (user_id);
create index contacts_client_id_idx on public.contacts (client_id);
create index tasks_user_id_status_idx on public.tasks (user_id, status);
create index tasks_user_id_due_date_idx on public.tasks (user_id, due_date);
create index tasks_area_id_idx on public.tasks (area_id);
create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_contact_id_idx on public.tasks (contact_id);
create index monitoring_user_id_status_idx on public.monitoring_items (user_id, status, follow_up_on);
create index monitoring_area_id_idx on public.monitoring_items (area_id);
create index monitoring_client_id_idx on public.monitoring_items (client_id);
create index monitoring_contact_id_idx on public.monitoring_items (contact_id);
create index monitoring_task_id_idx on public.monitoring_items (task_id);

-- ============ updated_at ============
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.areas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.monitoring_items for each row execute function public.set_updated_at();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;
alter table public.monitoring_items enable row level security;

create policy "perfil: ver o próprio" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: editar o próprio" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "dono: select" on public.areas for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.areas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: update" on public.areas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.areas for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dono: select" on public.clients for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.clients for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: update" on public.clients for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.clients for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dono: select" on public.contacts for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.contacts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: update" on public.contacts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.contacts for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dono: select" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: update" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dono: select" on public.monitoring_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.monitoring_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: update" on public.monitoring_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.monitoring_items for delete to authenticated using ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.areas, public.clients, public.contacts, public.tasks, public.monitoring_items to authenticated;
revoke all on public.profiles, public.areas, public.clients, public.contacts, public.tasks, public.monitoring_items from anon;

-- ============ Novo usuário ============
create or replace function public.check_signup_allowed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.allowed_signups where lower(email) = lower(new.email)) then
    raise exception 'Cadastro não autorizado para este e-mail';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, 'admin');

  insert into public.areas (user_id, name, color, position) values
    (new.id, 'BasePro', '#3b82f6', 0),
    (new.id, 'Nexo', '#8b5cf6', 1),
    (new.id, 'Pessoal', '#10b981', 2);

  return new;
end;
$$;

revoke execute on function public.check_signup_allowed() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger check_signup_allowed before insert on auth.users
  for each row execute function public.check_signup_allowed();
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Os e-mails autorizados são cadastrados direto no banco (fora do repositório, que é público):
--   insert into public.allowed_signups (email) values ('<email>');

-- ============ Tempo real ============
alter publication supabase_realtime add table
  public.profiles, public.areas, public.clients, public.contacts, public.tasks, public.monitoring_items;
