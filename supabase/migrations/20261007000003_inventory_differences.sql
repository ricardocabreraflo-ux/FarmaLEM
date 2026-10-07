-- Diferencias encontradas al terminar el inventario del día (Calendario de
-- actividades) — cuánto le falta o le sobra a cada cajero en la categoría que
-- le tocó contar, con el precio ya sacado del catálogo de SICAR X, para saber
-- cuánto debe pagar. "Faltante" es lo único que se suma al saldo pendiente;
-- "Sobrante" solo queda de registro.
create table farmalem.inventory_differences (
  id uuid primary key default gen_random_uuid(),
  diff_date date not null,
  category text not null,
  shift text not null check (shift in ('Matutino', 'Vespertino')),
  kind text not null check (kind in ('Faltante', 'Sobrante')),
  barcode text,
  description text not null,
  unit_price numeric,
  quantity numeric not null check (quantity > 0),
  amount numeric,
  observations text,
  cashier_id uuid not null references farmalem.profiles(id),
  created_by uuid not null references farmalem.profiles(id),
  settled boolean not null default false,
  settled_at timestamptz,
  settled_by uuid references farmalem.profiles(id),
  created_at timestamptz not null default now()
);
create index inventory_differences_cashier_idx on farmalem.inventory_differences(cashier_id);
