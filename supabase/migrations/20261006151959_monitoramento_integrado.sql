-- Etapa 3a: áreas ligadas aos sistemas das empresas e anotações sobre itens externos

-- ============ Área ↔ sistema ============
alter table public.areas add column sistema text check (sistema in ('basepro', 'nexo'));
comment on column public.areas.sistema is 'Sistema da empresa ligado à área: basepro | nexo. Tarefa numa área com sistema pertence àquele sistema; área sem sistema (null) é só do Tarefeiro (pessoal).';
create unique index areas_user_sistema_key on public.areas (user_id, sistema) where sistema is not null;

update public.areas set sistema = 'basepro' where name = 'BasePro' and sistema is null;
update public.areas set sistema = 'nexo' where name = 'Nexo' and sistema is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email, 'admin');

  insert into public.areas (user_id, name, color, position, sistema) values
    (new.id, 'BasePro', '#3b82f6', 0, 'basepro'),
    (new.id, 'Nexo', '#8b5cf6', 1, 'nexo'),
    (new.id, 'Pessoal', '#10b981', 2, null);

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ============ Monitoramento integrado ============
alter table public.monitoring_items
  add column origem text not null default 'manual' check (origem in ('manual', 'basepro', 'nexo')),
  add column ref_externa text;

alter table public.monitoring_items
  add constraint monitoring_items_ref_externa_check check ((origem = 'manual') = (ref_externa is null)),
  add constraint monitoring_items_origem_ref_key unique (user_id, origem, ref_externa);

comment on column public.monitoring_items.origem is 'manual = criado no Tarefeiro (ex.: aguardando retorno). basepro/nexo = anotação sobre um item que vive no sistema da empresa (NF, conta a receber, empenho): os dados vêm de lá; aqui fica só o que é do usuário (cobrar em, notas, dispensado).';
comment on column public.monitoring_items.ref_externa is 'Item no sistema de origem, no formato <tabela>:<id>. Ex.: invoices:<uuid>, accounts_receivable:<uuid> (BasePro); faturamentos:<uuid>, transacoes_financeiras:<uuid>, contrato_empenhos:<uuid>, notas_fiscais_recebidas:<uuid> (Nexo).';
comment on column public.monitoring_items.status is 'aberto | resolvido | cancelado. Em itens dos sistemas, cancelado = dispensado pelo usuário (some do monitoramento).';
