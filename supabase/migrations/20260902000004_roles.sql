-- Catálogo de roles para Configuración > Usuarios (como en SICAR X). Por
-- ahora solo guarda el nombre; todavía no controla permisos ni módulos —
-- eso se conecta después.
create table if not exists farmalem.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  locked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into farmalem.roles (name, locked, sort_order) values
  ('ADMINISTRADOR', true, 10),
  ('SUPERVISOR', false, 20),
  ('VENDEDOR', true, 30)
on conflict (name) do nothing;
