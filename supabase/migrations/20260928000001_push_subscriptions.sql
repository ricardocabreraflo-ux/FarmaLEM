-- Suscripciones de notificaciones push del navegador/PWA (Web Push), una fila
-- por dispositivo en el que alguien activó "Notificaciones" en Configuración.
create table if not exists farmalem.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references farmalem.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_employee_id_idx on farmalem.push_subscriptions(employee_id);
