-- Control de productos de corta caducidad ("Caducidad corta"): un mes abierto
-- a la vez donde ambos turnos van registrando lo que encuentran en anaquel
-- próximo a caducar, con descuento manual mientras no sea antibiótico, y
-- ventas registradas a mano para ir bajando existencias — igual al Excel que
-- ya se llevaba, solo que el historial y el cierre mensual quedan en el panel.

create table farmalem.short_expiry_months (
  month text primary key, -- 'YYYY-MM'
  status text not null default 'Abierto' check (status in ('Abierto', 'Cerrado')),
  closed_by uuid references farmalem.profiles(id),
  closed_at timestamptz
);

create table farmalem.short_expiry_items (
  id uuid primary key default gen_random_uuid(),
  month text not null references farmalem.short_expiry_months(month),
  shelf text not null,
  barcode text not null,
  description text not null,
  physical_pieces numeric not null check (physical_pieces >= 0),
  unit_price numeric,
  expires_on date not null,
  discount_pct numeric,
  two_for_one boolean not null default false,
  in_system boolean not null default true,
  removed_from_system boolean not null default false,
  carried_from_prev_month boolean not null default false,
  notes text,
  reported_by uuid not null references farmalem.profiles(id),
  created_at timestamptz not null default now()
);
create index short_expiry_items_month_idx on farmalem.short_expiry_items(month);

create table farmalem.short_expiry_sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references farmalem.short_expiry_items(id) on delete cascade,
  shift text not null check (shift in ('Matutino', 'Vespertino')),
  quantity numeric not null check (quantity > 0),
  logged_by uuid not null references farmalem.profiles(id),
  logged_at timestamptz not null default now()
);
create index short_expiry_sales_item_idx on farmalem.short_expiry_sales(item_id);
