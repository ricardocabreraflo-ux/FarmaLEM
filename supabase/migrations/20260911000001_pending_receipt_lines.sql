-- Antes, una recepción de mercancía solo se podía guardar si TODOS sus
-- renglones ya estaban ligados a un producto real (código de barras,
-- descripción y precio de venta) — con un ticket real de muchos productos
-- nuevos eso obliga a completarlos todos de un jalón o se pierde la lectura
-- de la IA. Ahora el encabezado se puede guardar como "Pendiente" con los
-- renglones sin resolver guardados aparte, y se van completando uno por uno
-- (cada uno solo se vuelve un movimiento real en farmalem.purchases hasta
-- que se completa, para no meter costos/inventario a medias).

alter table farmalem.purchase_receipts
  add column if not exists status text not null default 'Completa' check (status in ('Pendiente', 'Completa'));

create table if not exists farmalem.purchase_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references farmalem.purchase_receipts(id) on delete cascade,
  supplier_code text,
  ticket_description text,
  quantity numeric(12,3) not null,
  unit_price numeric(12,4) not null,
  lot text,
  expires_on date,
  barcode text not null default '',
  description text not null default '',
  sale_price numeric(12,2),
  pack_factor integer not null default 1 check (pack_factor >= 1),
  purchase_id uuid references farmalem.purchases(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists purchase_receipt_lines_receipt_idx on farmalem.purchase_receipt_lines(receipt_id);
create index if not exists purchase_receipt_lines_purchase_idx on farmalem.purchase_receipt_lines(purchase_id);
