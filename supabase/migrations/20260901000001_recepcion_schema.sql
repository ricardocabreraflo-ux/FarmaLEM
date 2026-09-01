-- FarmaLEM · Módulo de Mercancías · Recepción de mercancía
-- Esquema inicial: proveedores, productos, equivalencias proveedor→producto,
-- recepciones y sus renglones (con lote y caducidad).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Utilería: updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Perfiles (rol por usuario)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'capturista' check (role in ('admin','capturista')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Proveedores
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legal_name text,
  rfc text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger suppliers_updated_at before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Productos FarmaLEM (catálogo propio, clave = código de barras)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique,
  short_code text,                         -- "clave corta" opcional (SICAR)
  name text not null,                      -- descripción FarmaLEM
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  last_cost numeric(12,4) not null default 0 check (last_cost >= 0),
  stock integer not null default 0,        -- piezas disponibles (se alimenta con recepciones)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_name_idx on public.products using gin (to_tsvector('spanish', name));
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Equivalencias: clave del proveedor → producto FarmaLEM
-- pack_factor: piezas FarmaLEM por unidad del ticket (ej. caja de 100 jeringas = 100)
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_code text not null,
  supplier_description text,
  product_id uuid not null references public.products(id) on delete cascade,
  pack_factor integer not null default 1 check (pack_factor >= 1),
  last_unit_price numeric(12,4),           -- último precio del ticket por unidad del proveedor
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, supplier_code)
);
create index if not exists supplier_products_product_idx on public.supplier_products(product_id);
create trigger supplier_products_updated_at before update on public.supplier_products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recepciones (un ticket / remisión del proveedor)
-- ---------------------------------------------------------------------------
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id),
  ticket_number text,
  ticket_date date not null default current_date,
  ticket_total numeric(12,2),              -- importe impreso en el ticket
  ticket_pieces integer,                   -- piezas impresas en el ticket
  ticket_savings numeric(12,2),
  status text not null default 'borrador' check (status in ('borrador','confirmada','cancelada')),
  photo_paths text[] not null default '{}', -- rutas en el bucket "tickets"
  raw_extraction jsonb,                     -- respuesta cruda de la lectura de fotos
  notes text,
  created_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists receipts_supplier_date_idx on public.receipts(supplier_id, ticket_date desc);
create trigger receipts_updated_at before update on public.receipts
  for each row execute function public.set_updated_at();

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  line_no integer not null,
  supplier_code text,
  ticket_description text,
  quantity numeric(12,3) not null check (quantity > 0),   -- unidades según el ticket
  unit_price numeric(12,4) not null check (unit_price >= 0), -- precio por unidad del ticket
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  lot text,
  expires_on date,
  product_id uuid references public.products(id),
  pack_factor integer not null default 1 check (pack_factor >= 1),
  pieces numeric(12,3) generated always as (quantity * pack_factor) stored,
  unit_cost numeric(12,4) generated always as (round(unit_price / pack_factor, 4)) stored,
  sale_price numeric(12,2),                -- precio de venta al momento de recibir
  created_at timestamptz not null default now(),
  unique (receipt_id, line_no)
);
create index if not exists receipt_items_product_idx on public.receipt_items(product_id);
create index if not exists receipt_items_expiry_idx on public.receipt_items(expires_on);

-- Vista de consulta: renglones con datos de producto y proveedor
create or replace view public.receipt_items_view as
select
  ri.*, r.ticket_date, r.ticket_number, r.status as receipt_status,
  s.name as supplier_name,
  p.barcode, p.name as product_name
from public.receipt_items ri
join public.receipts r on r.id = ri.receipt_id
join public.suppliers s on s.id = r.supplier_id
left join public.products p on p.id = ri.product_id;

-- ---------------------------------------------------------------------------
-- Confirmar recepción: suma piezas al stock y actualiza costo / equivalencias
-- ---------------------------------------------------------------------------
create or replace function public.confirm_receipt(p_receipt_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  select * into r from public.receipts where id = p_receipt_id for update;
  if r is null then raise exception 'Recepción no encontrada'; end if;
  if r.status = 'confirmada' then return; end if;

  update public.products p
  set stock = p.stock + agg.pieces,
      last_cost = agg.unit_cost,
      sale_price = coalesce(agg.sale_price, p.sale_price)
  from (
    select product_id, sum(pieces)::int as pieces,
           (array_agg(unit_cost order by line_no desc))[1] as unit_cost,
           (array_agg(sale_price order by line_no desc))[1] as sale_price
    from public.receipt_items
    where receipt_id = p_receipt_id and product_id is not null
    group by product_id
  ) agg
  where p.id = agg.product_id;

  insert into public.supplier_products (supplier_id, supplier_code, supplier_description, product_id, pack_factor, last_unit_price, last_seen_at)
  select r.supplier_id, ri.supplier_code, ri.ticket_description, ri.product_id, ri.pack_factor, ri.unit_price, now()
  from public.receipt_items ri
  where ri.receipt_id = p_receipt_id and ri.product_id is not null and ri.supplier_code is not null
  on conflict (supplier_id, supplier_code) do update
    set product_id = excluded.product_id,
        supplier_description = coalesce(excluded.supplier_description, supplier_products.supplier_description),
        pack_factor = excluded.pack_factor,
        last_unit_price = excluded.last_unit_price,
        last_seen_at = now();

  update public.receipts set status = 'confirmada', confirmed_at = now() where id = p_receipt_id;
end $$;

-- ---------------------------------------------------------------------------
-- Seguridad: usuarios autenticados (equipo FarmaLEM) pueden leer y escribir
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.supplier_products enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

create policy "profiles: propio" on public.profiles for select to authenticated using (id = auth.uid());
create policy "suppliers: equipo" on public.suppliers for all to authenticated using (true) with check (true);
create policy "products: equipo" on public.products for all to authenticated using (true) with check (true);
create policy "supplier_products: equipo" on public.supplier_products for all to authenticated using (true) with check (true);
create policy "receipts: equipo" on public.receipts for all to authenticated using (true) with check (true);
create policy "receipt_items: equipo" on public.receipt_items for all to authenticated using (true) with check (true);

grant execute on function public.confirm_receipt(uuid) to authenticated;

-- Bucket privado para las fotos de tickets
insert into storage.buckets (id, name, public) values ('tickets', 'tickets', false)
on conflict (id) do nothing;
create policy "tickets: leer equipo" on storage.objects for select to authenticated using (bucket_id = 'tickets');
create policy "tickets: subir equipo" on storage.objects for insert to authenticated with check (bucket_id = 'tickets');
create policy "tickets: borrar equipo" on storage.objects for delete to authenticated using (bucket_id = 'tickets');
