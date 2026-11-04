-- Confirmación de tareas operativas recurrentes (toldo, luces...): guarda
-- quién y cuándo marcó "Ya lo hice" ese día, para avisarle a administración.
create table farmalem.operational_task_checks (
  id uuid primary key default gen_random_uuid(),
  task_key text not null,
  check_date date not null,
  employee_id uuid not null references farmalem.profiles(id),
  done_at timestamptz not null default now(),
  unique (task_key, check_date)
);
