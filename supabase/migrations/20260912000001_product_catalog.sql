-- Catálogo de referencia de productos (exportado de SICAR X) — solo para
-- consultar precio de venta y compararlo contra el costo cuando se conozca;
-- no se usa para existencias/inventario, se reemplaza completo cada vez que
-- se sube un archivo nuevo.
create table if not exists farmalem.product_catalog (
  barcode text primary key,
  description text not null,
  department text,
  category text,
  unit text,
  sale_price numeric(12,2),
  sale_price_net numeric(12,2),
  updated_at timestamptz not null default now()
);
