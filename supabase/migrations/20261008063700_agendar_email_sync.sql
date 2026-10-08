-- Robô de e-mail a cada 10 minutos. A chave sai do Vault na hora da chamada.
select cron.schedule(
  'email-sync',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://vcngbmmhrfplufukkjuv.supabase.co/functions/v1/email-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-key', public.email_chave_sync()),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  )
  $$
);

-- Limpeza diária: rodadas com mais de 30 dias e pedidos de conexão abandonados
select cron.schedule(
  'email-limpeza',
  '15 4 * * *',
  $$
  delete from public.sync_runs where iniciado_em < now() - interval '30 days';
  delete from public.email_oauth_estados where created_at < now() - interval '1 day';
  $$
);
