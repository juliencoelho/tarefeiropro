-- O espelho passa a aceitar subtarefas (itens de checklist do To Do) na criação da tarefa
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
                                  start_time, end_time, area_id, in_inbox, source, origem_ref, subtasks)
        values (v_user, left(coalesce(nullif(v_item->>'titulo', ''), '(sem título)'), 300),
                coalesce(v_item->>'descricao', ''), coalesce(v_item->>'status', 'para_fazer'),
                coalesce(v_item->>'prioridade', 'media'), coalesce(v_item->>'tipo', 'tarefa'),
                (v_item->>'prazo')::date, coalesce((v_item->>'prazo_original')::date, (v_item->>'prazo')::date),
                (v_item->>'inicio')::time, (v_item->>'fim')::time, (v_item->>'area_id')::uuid,
                (v_item->>'area_id') is null, p_source, v_item->>'ref',
                case when jsonb_typeof(v_item->'subtarefas') = 'array' then v_item->'subtarefas' else '[]'::jsonb end)
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
