-- Las tareas "toldo" y "luces" dejan de tener su propio cron job a hora fija
-- (jobid 3 y 4) — ahora viven en operational_task_defs, configurables desde
-- Configuración → Tareas operativas sin tocar código ni pg_cron. Un solo
-- cron corre cada 5 minutos y manda el push a la tarea que le toque según su
-- hora/días/turno guardados en la tabla.
select cron.unschedule(3);
select cron.unschedule(4);

select cron.schedule(
  'farmalem_tareas_operativas',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://farmalem.netlify.app/api/cron/notificaciones?kind=tareas_operativas',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '8e65bf8d12edc8903d6f56acea929b68c55bec315e8b0bab7cc950ef8205ed20'),
    body := '{}'::jsonb
  );
  $$
);
