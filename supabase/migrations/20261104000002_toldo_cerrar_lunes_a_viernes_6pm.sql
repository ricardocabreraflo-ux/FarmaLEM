-- Recoger el toldo es tarea del turno Vespertino de lunes a viernes a las
-- 6:00pm (antes disparaba todos los días a las 7:00pm). 6:00pm CDMX cae en
-- 00:00 UTC del día siguiente, así que lunes-viernes CDMX = martes-sábado UTC.
select cron.alter_job(job_id := 3, schedule := '0 0 * * 2-6');
