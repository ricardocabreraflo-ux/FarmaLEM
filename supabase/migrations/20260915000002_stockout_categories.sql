-- Categorías para Negados y faltantes (antes fijas en el código: Patente,
-- Suelto, Perfumería) — ahora se administran desde Configuración, igual que
-- los roles de Usuarios.

create table if not exists farmalem.stockout_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into farmalem.stockout_categories (name, sort_order)
values ('Patente', 10), ('Suelto', 20), ('Perfumería', 30)
on conflict (name) do nothing;
