-- Tarefas que nascem em outro lugar (agenda do BasePro, chamados do Nexo, e-mails, To Do)
-- e correlação entre tarefas ("se complementam" ou "uma depende da outra").

-- ============ Origem da tarefa ============
alter table public.tasks drop constraint if exists tasks_source_check;
alter table public.tasks add constraint tasks_source_check
  check (source in ('app', 'cowork', 'basepro', 'nexo', 'email', 'todo'));
alter table public.tasks add column origem_ref text;
comment on column public.tasks.source is
  'Quem criou: app, cowork, ou o lugar de onde a tarefa veio (basepro = agenda do BasePro, nexo = chamado de suporte do Nexo, email, todo = Microsoft To Do).';
comment on column public.tasks.origem_ref is 'Id do item no lugar de origem (agenda_items.id, suporte_tickets.id, emails.id...).';

-- Tudo o que já foi trazido de fora, mesmo que a tarefa tenha sido apagada depois:
-- assim o espelho não recria o que o usuário descartou.
create table public.tarefas_origens (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null check (source in ('basepro', 'nexo', 'email', 'todo')),
  ref text not null,
  task_id uuid references public.tasks(id) on delete set null,
  fechada_em timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, source, ref)
);
comment on table public.tarefas_origens is
  'Itens de fora já trazidos para o Tarefeiro. fechada_em = a origem concluiu/cancelou e a tarefa foi dada como feita.';
create index tarefas_origens_task_idx on public.tarefas_origens (task_id);

alter table public.tarefas_origens enable row level security;
create policy "dono: select" on public.tarefas_origens for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.tarefas_origens for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: update" on public.tarefas_origens for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.tarefas_origens to authenticated;
revoke all on public.tarefas_origens from anon;

-- Espelho: o app lê a origem (com o login do usuário lá) e manda os itens para cá.
-- Item aberto e nunca visto vira tarefa; item fechado na origem conclui a tarefa.
-- Depois de criada, a tarefa é do usuário: o espelho não sobrescreve título, prazo nem área.
-- p_itens: [{ref, aberto, titulo, descricao, prazo, prazo_original, inicio, fim, tipo, status, prioridade, area_id, fechado_em}]
create or replace function public.espelhar_tarefas(p_source text, p_itens jsonb)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_task uuid;
  v_criadas int := 0;
  v_concluidas int := 0;
begin
  if v_user is null then raise exception 'Sessão do Tarefeiro ausente'; end if;
  if p_source not in ('basepro', 'nexo', 'todo') then raise exception 'Origem inválida: %', p_source; end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    if coalesce((v_item->>'aberto')::boolean, true) then
      insert into public.tarefas_origens (user_id, source, ref) values (v_user, p_source, v_item->>'ref')
      on conflict do nothing;
      if found then
        insert into public.tasks (user_id, title, description, status, priority, type, due_date, original_due_date,
                                  start_time, end_time, area_id, in_inbox, source, origem_ref)
        values (v_user, left(coalesce(nullif(v_item->>'titulo', ''), '(sem título)'), 300),
                coalesce(v_item->>'descricao', ''), coalesce(v_item->>'status', 'para_fazer'),
                coalesce(v_item->>'prioridade', 'media'), coalesce(v_item->>'tipo', 'tarefa'),
                (v_item->>'prazo')::date, coalesce((v_item->>'prazo_original')::date, (v_item->>'prazo')::date),
                (v_item->>'inicio')::time, (v_item->>'fim')::time, (v_item->>'area_id')::uuid,
                (v_item->>'area_id') is null, p_source, v_item->>'ref')
        returning id into v_task;
        update public.tarefas_origens set task_id = v_task
        where user_id = v_user and source = p_source and ref = v_item->>'ref';
        v_criadas := v_criadas + 1;
      end if;
    else
      update public.tasks t set status = 'feito', completed_at = coalesce((v_item->>'fechado_em')::timestamptz, now())
      from public.tarefas_origens o
      where o.user_id = v_user and o.source = p_source and o.ref = v_item->>'ref' and o.fechada_em is null
        and t.id = o.task_id and t.status <> 'feito';
      if found then v_concluidas := v_concluidas + 1; end if;
      update public.tarefas_origens set fechada_em = now()
      where user_id = v_user and source = p_source and ref = v_item->>'ref' and fechada_em is null;
    end if;
  end loop;

  return jsonb_build_object('criadas', v_criadas, 'concluidas', v_concluidas);
end $$;

revoke execute on function public.espelhar_tarefas(text, jsonb) from public, anon;
grant execute on function public.espelhar_tarefas(text, jsonb) to authenticated;

-- ============ Correlação entre tarefas ============
-- complementa: as duas andam juntas (sem ordem).
-- depende_de: task_id só deve ser feita depois de outra_id.
create table public.task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  outra_id uuid not null references public.tasks(id) on delete cascade,
  tipo text not null default 'complementa' check (tipo in ('complementa', 'depende_de')),
  created_at timestamptz not null default now(),
  check (task_id <> outra_id)
);
comment on table public.task_links is
  'Tarefas correlacionadas. complementa = andam juntas; depende_de = task_id só deve ser feita depois de outra_id.';

-- Um vínculo por par, em qualquer sentido
create unique index task_links_par_idx on public.task_links (least(task_id, outra_id), greatest(task_id, outra_id));
create index task_links_task_idx on public.task_links (task_id);
create index task_links_outra_idx on public.task_links (outra_id);
create index task_links_user_idx on public.task_links (user_id);

alter table public.task_links enable row level security;
create policy "dono: select" on public.task_links for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.task_links for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid()))
  and exists (select 1 from public.tasks t where t.id = outra_id and t.user_id = (select auth.uid()))
);
create policy "dono: update" on public.task_links for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.task_links for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.task_links to authenticated;
revoke all on public.task_links from anon;

alter publication supabase_realtime add table public.task_links;

-- ============ Funções para o Cowork ============

-- Liga duas tarefas. Com 'depende_de', p_tarefa só deve ser feita depois de p_outra.
create or replace function cowork.relacionar(p_tarefa uuid, p_outra uuid, p_tipo text default 'complementa')
returns table (tarefa text, tipo text, outra text)
language plpgsql set search_path = '' as $$
declare v_dono uuid := (select t.user_id from public.tasks t where t.id = p_tarefa);
begin
  if v_dono is null then raise exception 'Tarefa % não encontrada', p_tarefa; end if;
  if not exists (select 1 from public.tasks t where t.id = p_outra and t.user_id = v_dono) then
    raise exception 'Tarefa % não encontrada', p_outra;
  end if;
  delete from public.task_links l
  where least(l.task_id, l.outra_id) = least(p_tarefa, p_outra) and greatest(l.task_id, l.outra_id) = greatest(p_tarefa, p_outra);
  insert into public.task_links (user_id, task_id, outra_id, tipo) values (v_dono, p_tarefa, p_outra, p_tipo);
  return query
    select a.title, case when p_tipo = 'depende_de' then 'depende de' else 'complementa' end, b.title
    from public.tasks a, public.tasks b where a.id = p_tarefa and b.id = p_outra;
end $$;

create or replace function cowork.desrelacionar(p_tarefa uuid, p_outra uuid)
returns void language sql set search_path = '' as $$
  delete from public.task_links l
  where least(l.task_id, l.outra_id) = least(p_tarefa, p_outra) and greatest(l.task_id, l.outra_id) = greatest(p_tarefa, p_outra)
$$;

-- Tarefas ligadas a uma tarefa, com o sentido do vínculo do ponto de vista dela
create or replace function cowork.relacionadas(p_tarefa uuid)
returns table (id uuid, titulo text, status text, prazo date, vinculo text)
language sql stable set search_path = '' as $$
  select t.id, t.title, t.status, t.due_date,
         case when l.tipo = 'complementa' then 'complementa'
              when l.task_id = p_tarefa then 'esta depende dela'
              else 'ela depende desta' end
  from public.task_links l
  join public.tasks t on t.id = case when l.task_id = p_tarefa then l.outra_id else l.task_id end
  where p_tarefa in (l.task_id, l.outra_id)
  order by t.status = 'feito', t.due_date nulls last
$$;

-- Transforma um e-mail em tarefa e liga os dois (o e-mail some de "pedindo ação")
create or replace function cowork.tarefa_do_email(
  p_email_id uuid,
  p_titulo text,
  p_area text default null,
  p_prazo date default null,
  p_para_hoje boolean default false,
  p_prioridade text default 'media'
)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
declare
  v_email public.emails%rowtype;
  v_area uuid;
  v_id uuid;
begin
  select * into v_email from public.emails e where e.id = p_email_id;
  if v_email.id is null then raise exception 'E-mail % não encontrado', p_email_id; end if;
  v_area := cowork.exigir_area(p_area, v_email.user_id);
  insert into public.tasks (user_id, title, description, priority, area_id, due_date, original_due_date,
                            planned_for, in_inbox, source, origem_ref)
  values (v_email.user_id, p_titulo,
          concat_ws(E'\n', 'E-mail de ' || coalesce(v_email.de_nome || ' ', '') || '<' || coalesce(v_email.de_endereco, '') || '>',
                    'Assunto: ' || coalesce(v_email.assunto, ''),
                    case when v_email.link_web is not null then 'Abrir no Outlook: ' || v_email.link_web end),
          p_prioridade, v_area, p_prazo, p_prazo,
          case when p_para_hoje then cowork.hoje_br() end,
          v_area is null and not p_para_hoje, 'email', p_email_id::text)
  returning tasks.id into v_id;
  insert into public.tarefas_origens (user_id, source, ref, task_id) values (v_email.user_id, 'email', p_email_id::text, v_id)
  on conflict (user_id, source, ref) do update set task_id = excluded.task_id;
  update public.emails set tarefa_id = v_id where emails.id = p_email_id;
  return query select * from cowork.resumo(array[v_id]);
end $$;

revoke execute on all functions in schema cowork from public, anon, authenticated;
