-- Etapa 3c: funções para o assistente (Cowork) operar o Tarefeiro por SQL.
-- Ficam no schema `cowork`, que não é exposto pela API REST do app: só quem
-- tem acesso direto ao banco (o conector Supabase) consegue chamar.

create schema if not exists cowork;
comment on schema cowork is 'Funções para o assistente (Cowork) operar o Tarefeiro via SQL. Fora da API REST.';
revoke all on schema cowork from public, anon, authenticated;

-- Dia de hoje no fuso de Brasília
create or replace function cowork.hoje_br() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- Dono das linhas: com e-mail, aquele usuário; sem, o primeiro admin (uso pessoal)
create or replace function cowork.dono(p_email text default null) returns uuid
language sql stable set search_path = '' as $$
  select p.id from public.profiles p
  where p_email is null or lower(p.email) = lower(p_email)
  order by (p.role = 'admin') desc, p.created_at
  limit 1
$$;

-- Área por nome ("Pessoal") ou pelo sistema ("basepro", "base", "nexo", "hospicare", "fernandes")
create or replace function cowork.area_id(p_area text, p_dono uuid) returns uuid
language sql stable set search_path = '' as $$
  select a.id from public.areas a
  where a.user_id = p_dono and not a.archived
    and (
      lower(a.name) = lower(trim(p_area))
      or (a.sistema = 'basepro' and lower(trim(p_area)) in ('basepro', 'base', 'fernandes', 'representação', 'representacao'))
      or (a.sistema = 'nexo' and lower(trim(p_area)) in ('nexo', 'hospicare'))
    )
  order by (lower(a.name) = lower(trim(p_area))) desc
  limit 1
$$;

create or replace function cowork.exigir_area(p_area text, p_dono uuid) returns uuid
language plpgsql stable set search_path = '' as $$
declare v_id uuid;
begin
  if p_area is null then return null; end if;
  v_id := cowork.area_id(p_area, p_dono);
  if v_id is null then
    raise exception 'Área "%" não encontrada. Veja as existentes com: select * from cowork.areas();', p_area;
  end if;
  return v_id;
end $$;

-- Linha de tarefa no formato que as funções devolvem
create or replace function cowork.resumo(p_ids uuid[])
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language sql stable set search_path = '' as $$
  select t.id, t.title, t.type, t.status, a.name, t.due_date, t.planned_for,
         case when t.start_time is not null
              then to_char(t.start_time, 'HH24:MI') || coalesce('–' || to_char(t.end_time, 'HH24:MI'), '') end,
         t.priority, t.in_inbox, t.source
  from public.tasks t left join public.areas a on a.id = t.area_id
  where t.id = any(p_ids)
$$;

-- ============ Consultas ============

create or replace function cowork.areas(p_email text default null)
returns table (nome text, sistema text, pendencias bigint)
language sql stable set search_path = '' as $$
  select a.name, coalesce(a.sistema, 'só no Tarefeiro'),
         (select count(*) from public.tasks t where t.area_id = a.id and t.status <> 'feito')
  from public.areas a
  where a.user_id = cowork.dono(p_email) and not a.archived
  order by a.position
$$;

-- O dia, nas mesmas seções da tela Hoje
create or replace function cowork.hoje(p_dia date default null, p_email text default null)
returns table (secao text, id uuid, titulo text, area text, horario text, prazo date,
               planejada_para date, prioridade text, status text, origem text)
language sql stable set search_path = '' as $$
  with base as (
    select t.*, a.name as area_nome, coalesce(p_dia, cowork.hoje_br()) as dia
    from public.tasks t left join public.areas a on a.id = t.area_id
    where t.user_id = cowork.dono(p_email)
  ), classificadas as (
    select case
             when type = 'evento' and due_date = dia then '1_compromisso'
             when type <> 'evento' and status <> 'feito' and planned_for = dia then '2_planejada'
             when type <> 'evento' and status <> 'feito' and not in_inbox and planned_for is distinct from dia
                  and (due_date <= dia or planned_for < dia) then '3_pra_considerar'
             when type <> 'evento' and status = 'feito'
                  and ((completed_at at time zone 'America/Sao_Paulo')::date = dia or planned_for = dia) then '4_concluida'
           end as secao_ord, *
    from base
  )
  select substr(secao_ord, 3), id, title, area_nome,
         case when start_time is not null
              then to_char(start_time, 'HH24:MI') || coalesce('–' || to_char(end_time, 'HH24:MI'), '') end,
         due_date, planned_for, priority, status, source
  from classificadas
  where secao_ord is not null
  order by secao_ord, start_time nulls last, due_date nulls last, created_at
$$;

create or replace function cowork.caixa_de_entrada(p_email text default null)
returns table (id uuid, titulo text, criada_em timestamptz, origem text)
language sql stable set search_path = '' as $$
  select t.id, t.title, t.created_at, t.source
  from public.tasks t
  where t.user_id = cowork.dono(p_email) and t.in_inbox and t.status <> 'feito'
  order by t.created_at desc
$$;

-- Busca tarefas abertas (ou também as feitas) pelo texto do título ou da descrição
create or replace function cowork.buscar(p_texto text, p_incluir_feitas boolean default false, p_email text default null)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language sql stable set search_path = '' as $$
  select * from cowork.resumo(array(
    select t.id from public.tasks t
    where t.user_id = cowork.dono(p_email)
      and (p_incluir_feitas or t.status <> 'feito')
      and (t.title ilike '%' || p_texto || '%' or t.description ilike '%' || p_texto || '%')
    order by t.created_at desc
    limit 30
  ))
$$;

-- ============ Ações em tarefas ============

-- Captura uma tarefa. Sem área e sem "para hoje", vai para a caixa de entrada (como no app).
create or replace function cowork.capturar(
  p_titulo text,
  p_area text default null,
  p_prazo date default null,
  p_para_hoje boolean default false,
  p_descricao text default '',
  p_prioridade text default 'media',
  p_email text default null
)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
declare
  v_dono uuid := cowork.dono(p_email);
  v_area uuid := cowork.exigir_area(p_area, v_dono);
  v_id uuid;
begin
  if v_dono is null then raise exception 'Nenhum usuário cadastrado no Tarefeiro'; end if;
  insert into public.tasks (user_id, title, description, priority, area_id, due_date, original_due_date,
                            planned_for, in_inbox, source)
  values (v_dono, p_titulo, coalesce(p_descricao, ''), p_prioridade, v_area, p_prazo, p_prazo,
          case when p_para_hoje then cowork.hoje_br() end,
          v_area is null and not p_para_hoje, 'cowork')
  returning tasks.id into v_id;
  return query select * from cowork.resumo(array[v_id]);
end $$;

-- Agenda um compromisso com horário (fim padrão: 1 hora depois do início)
create or replace function cowork.agendar(
  p_titulo text,
  p_dia date,
  p_inicio time,
  p_fim time default null,
  p_area text default null,
  p_descricao text default '',
  p_email text default null
)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
declare
  v_dono uuid := cowork.dono(p_email);
  v_area uuid := cowork.exigir_area(p_area, v_dono);
  v_id uuid;
begin
  if v_dono is null then raise exception 'Nenhum usuário cadastrado no Tarefeiro'; end if;
  insert into public.tasks (user_id, title, description, type, area_id, due_date, original_due_date,
                            start_time, end_time, in_inbox, source)
  values (v_dono, p_titulo, coalesce(p_descricao, ''), 'evento', v_area, p_dia, p_dia,
          p_inicio, coalesce(p_fim, p_inicio + interval '1 hour'), false, 'cowork')
  returning tasks.id into v_id;
  return query select * from cowork.resumo(array[v_id]);
end $$;

create or replace function cowork.concluir(p_tarefa uuid)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
begin
  update public.tasks set status = 'feito', completed_at = now(), in_inbox = false where tasks.id = p_tarefa;
  if not found then raise exception 'Tarefa % não encontrada', p_tarefa; end if;
  return query select * from cowork.resumo(array[p_tarefa]);
end $$;

create or replace function cowork.reabrir(p_tarefa uuid)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
begin
  update public.tasks set status = 'para_fazer' where tasks.id = p_tarefa;
  if not found then raise exception 'Tarefa % não encontrada', p_tarefa; end if;
  return query select * from cowork.resumo(array[p_tarefa]);
end $$;

-- Planeja para um dia (padrão: hoje). Com p_dia = null tira do plano.
create or replace function cowork.planejar(p_tarefa uuid, p_dia date default cowork.hoje_br())
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
begin
  update public.tasks set planned_for = p_dia, in_inbox = case when p_dia is null then in_inbox else false end
  where tasks.id = p_tarefa;
  if not found then raise exception 'Tarefa % não encontrada', p_tarefa; end if;
  return query select * from cowork.resumo(array[p_tarefa]);
end $$;

-- Move para uma área (tira da caixa de entrada)
create or replace function cowork.mover(p_tarefa uuid, p_area text)
returns table (id uuid, titulo text, tipo text, status text, area text, prazo date, planejada_para date,
               horario text, prioridade text, na_caixa_de_entrada boolean, origem text)
language plpgsql set search_path = '' as $$
declare v_area uuid := cowork.exigir_area(p_area, (select t.user_id from public.tasks t where t.id = p_tarefa));
begin
  update public.tasks set area_id = v_area, in_inbox = false where tasks.id = p_tarefa;
  if not found then raise exception 'Tarefa % não encontrada', p_tarefa; end if;
  return query select * from cowork.resumo(array[p_tarefa]);
end $$;

-- ============ Monitoramento ============

-- Item manual de "aguardando retorno" (padrão: cobrar em 2 dias)
create or replace function cowork.aguardando(
  p_titulo text,
  p_cobrar_em date default null,
  p_nota text default null,
  p_email text default null
)
returns table (id uuid, titulo text, cobrar_em date, nota text)
language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.monitoring_items (user_id, origem, kind, title, follow_up_on, notes, source)
  values (cowork.dono(p_email), 'manual', 'aguardando_retorno', p_titulo,
          coalesce(p_cobrar_em, cowork.hoje_br() + 2), p_nota, 'cowork')
  returning monitoring_items.id into v_id;
  return query select m.id, m.title, m.follow_up_on, m.notes from public.monitoring_items m where m.id = v_id;
end $$;

-- Marca "cobrar em" (e/ou anota) num item que vive no BasePro/Nexo. Cria a anotação na primeira vez.
-- p_ref segue o formato do app: invoices:<id>, accounts_receivable:<id> (basepro);
-- faturamentos:<id>, transacoes_financeiras:<id>, notas_fiscais_recebidas:<id>,
-- contrato_empenhos:<número>@<órgão>|<estágio> (nexo, empenho agrupado)
create or replace function cowork.cobrar_em(
  p_origem text,
  p_ref text,
  p_tipo text,
  p_titulo text,
  p_dia date,
  p_nota text default null,
  p_email text default null
)
returns table (id uuid, titulo text, cobrar_em date, nota text, status text)
language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.monitoring_items (user_id, origem, ref_externa, kind, title, follow_up_on, notes, status, source)
  values (cowork.dono(p_email), p_origem, p_ref, p_tipo, p_titulo, p_dia, p_nota, 'aberto', 'cowork')
  on conflict (user_id, origem, ref_externa) do update
    set follow_up_on = excluded.follow_up_on,
        notes = coalesce(excluded.notes, monitoring_items.notes),
        status = 'aberto'
  returning monitoring_items.id into v_id;
  return query select m.id, m.title, m.follow_up_on, m.notes, m.status from public.monitoring_items m where m.id = v_id;
end $$;

-- Anotações do usuário: o que está marcado para cobrar até o dia (padrão: hoje) e os "aguardando retorno"
create or replace function cowork.cobrancas_marcadas(p_ate date default null, p_email text default null)
returns table (origem text, ref_externa text, tipo text, titulo text, cobrar_em date, nota text, status text)
language sql stable set search_path = '' as $$
  select m.origem, m.ref_externa, m.kind, m.title, m.follow_up_on, m.notes, m.status
  from public.monitoring_items m
  where m.user_id = cowork.dono(p_email) and m.status = 'aberto'
    and (m.follow_up_on <= coalesce(p_ate, cowork.hoje_br()) or (m.origem = 'manual' and m.follow_up_on is null))
  order by m.follow_up_on nulls first
$$;

-- Nada aqui é chamável pela API do app
revoke execute on all functions in schema cowork from public, anon, authenticated;
