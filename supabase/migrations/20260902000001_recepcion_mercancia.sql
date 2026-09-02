-- FarmaLEM · Recepción de mercancía (lectura de tickets con IA)
-- Reutiliza farmalem.suppliers y farmalem.purchases (que ya alimentan Inventario
-- y Proveedores) en vez de duplicar un catálogo de productos aparte:
--   - farmalem.purchases sigue siendo la fuente de "qué se recibió"; se le
--     agregan lote, caducidad, factor de empaque, clave del proveedor y a qué
--     recepción (ticket) pertenece.
--   - farmalem.purchase_receipts es el encabezado de un ticket recibido.
--   - farmalem.supplier_products son las equivalencias clave del
--     proveedor -> código de barras/descripción/precio/factor de empaque,
--     para que la próxima vez que aparezca esa clave el renglón se llene solo.
--
-- Sin RLS: esta app no usa Supabase Auth, todo el acceso pasa por el service
-- role desde el servidor (supabaseAdmin()), igual que el resto del esquema
-- farmalem.

-- ---------------------------------------------------------------------------
-- Encabezado de una recepción (ticket/remisión de un proveedor)
-- ---------------------------------------------------------------------------
create table if not exists farmalem.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references farmalem.suppliers(id),
  ticket_number text,
  ticket_date date not null default current_date,
  ticket_total numeric(12,2),
  ticket_pieces integer,
  ticket_savings numeric(12,2),
  photo_paths text[] not null default '{}',
  raw_extraction jsonb,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists purchase_receipts_supplier_date_idx on farmalem.purchase_receipts(supplier_id, ticket_date desc);

-- ---------------------------------------------------------------------------
-- Equivalencias: clave del proveedor -> producto FarmaLEM
-- pack_factor: piezas FarmaLEM por unidad del ticket (ej. caja de 100 jeringas = 100)
-- ---------------------------------------------------------------------------
create table if not exists farmalem.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references farmalem.suppliers(id) on delete cascade,
  supplier_code text not null,
  supplier_description text,
  barcode text not null,
  description text not null,
  sale_price numeric(12,2),
  pack_factor integer not null default 1 check (pack_factor >= 1),
  last_unit_price numeric(12,4),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, supplier_code)
);
create index if not exists supplier_products_barcode_idx on farmalem.supplier_products(barcode);

-- ---------------------------------------------------------------------------
-- farmalem.purchases: columnas nuevas para lo que trae un renglón de ticket
-- ---------------------------------------------------------------------------
alter table farmalem.purchases
  add column if not exists lot text,
  add column if not exists expires_on date,
  add column if not exists pack_factor integer not null default 1,
  add column if not exists supplier_code text,
  add column if not exists receipt_id uuid references farmalem.purchase_receipts(id) on delete set null;

create index if not exists purchases_receipt_idx on farmalem.purchases(receipt_id);
create index if not exists purchases_barcode_idx on farmalem.purchases(barcode);
