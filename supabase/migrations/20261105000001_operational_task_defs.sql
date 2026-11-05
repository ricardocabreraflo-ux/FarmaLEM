-- Tareas operativas configurables desde Configuración (antes "toldo" y
-- "luces" estaban fijas en el código) — administración puede agregar más,
-- cambiar la hora, los días o el turno sin que se tenga que tocar código.
create table farmalem.operational_task_defs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  hour smallint not null check (hour between 0 and 23),
  minute smallint not null default 0 check (minute between 0 and 59),
  weekdays smallint[] not null, -- 0 domingo ... 6 sábado
  shift text not null check (shift in ('Matutino','Vespertino')),
  active boolean not null default true,
  created_by uuid not null references farmalem.profiles(id),
  created_at timestamptz not null default now()
);

-- Evita mandar el push de una tarea dos veces el mismo día (el cron corre cada 5 min).
create table farmalem.operational_task_pushes (
  task_key text not null,
  push_date date not null,
  sent_at timestamptz not null default now(),
  primary key (task_key, push_date)
);

insert into farmalem.operational_task_defs (key, label, hour, minute, weekdays, shift, created_by)
select 'toldo', 'Recoger el toldo', 18, 0, array[1,2,3,4,5]::smallint[], 'Vespertino', id from farmalem.profiles where role = 'admin' limit 1;

insert into farmalem.operational_task_defs (key, label, hour, minute, weekdays, shift, created_by)
select 'luces', 'Encender las luces de afuera', 18, 0, array[0,1,2,3,4,5,6]::smallint[], 'Vespertino', id from farmalem.profiles where role = 'admin' limit 1;
