-- Recordatorios programados: pg_cron llama por https (pg_net) a la ruta
-- /api/cron/notificaciones del propio panel, que ya tiene configuradas las
-- llaves VAPID/web-push. Protegido con el secreto CRON_SECRET (variable de
-- entorno en Netlify) para que solo pg_net pueda disparar estos avisos.
-- Horarios en UTC — Ciudad de México es UTC-6 fijo (sin horario de verano
-- desde 2022), así que la resta/suma es constante todo el año.
select cron.schedule(
  'farmalem_toldo_abrir',
  '0 14 * * *', -- 8:00am CDMX
  $$
  select net.http_post(
    url := 'https://farmalem.netlify.app/api/cron/notificaciones?kind=toldo_abrir',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '8e65bf8d12edc8903d6f56acea929b68c55bec315e8b0bab7cc950ef8205ed20'),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'farmalem_toldo_cerrar',
  '0 1 * * *', -- 7:00pm CDMX
  $$
  select net.http_post(
    url := 'https://farmalem.netlify.app/api/cron/notificaciones?kind=toldo_cerrar',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '8e65bf8d12edc8903d6f56acea929b68c55bec315e8b0bab7cc950ef8205ed20'),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'farmalem_luces',
  '0 0 * * *', -- 6:00pm CDMX
  $$
  select net.http_post(
    url := 'https://farmalem.netlify.app/api/cron/notificaciones?kind=luces',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '8e65bf8d12edc8903d6f56acea929b68c55bec315e8b0bab7cc950ef8205ed20'),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'farmalem_bono_semanal',
  '0 2 * * 1', -- domingo 8:00pm CDMX (lunes 02:00 UTC)
  $$
  select net.http_post(
    url := 'https://farmalem.netlify.app/api/cron/notificaciones?kind=bono_semanal',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '8e65bf8d12edc8903d6f56acea929b68c55bec315e8b0bab7cc950ef8205ed20'),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'farmalem_caducidad_mensual',
  '0 16 28 * *', -- día 28, 10:00am CDMX
  $$
  select net.http_post(
    url := 'https://farmalem.netlify.app/api/cron/notificaciones?kind=caducidad_mensual',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '8e65bf8d12edc8903d6f56acea929b68c55bec315e8b0bab7cc950ef8205ed20'),
    body := '{}'::jsonb
  );
  $$
);
