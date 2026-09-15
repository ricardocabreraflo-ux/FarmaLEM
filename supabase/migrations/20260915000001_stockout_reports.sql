-- Negados y faltantes: control diario de lo que se le niega a un cliente
-- (no se tiene) o falta (se conoce pero se acabó), calcado de la hoja de
-- Excel que ya usaban en el mostrador ("SUSTANCIA ACTIVA", categoría,
-- código de barras, precio, gramaje, presentación, piezas, turno).
-- Por ahora es solo un reporte — no se liga todavía a Recepción de
-- mercancía; eso se puede agregar después si el reporte resulta útil.

create table if not exists farmalem.stockout_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null default current_date,
  shift text not null check (shift in ('Matutino', 'Vespertino')),
  kind text not null check (kind in ('Faltante', 'Negado')),
  barcode text,
  active_substance text not null,
  category text,
  presentation text,
  gramaje text,
  quantity integer not null default 1 check (quantity > 0),
  sale_price numeric(12,2),
  cost numeric(12,4),
  notes text,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists stockout_reports_date_idx on farmalem.stockout_reports(report_date desc);
create index if not exists stockout_reports_resolved_idx on farmalem.stockout_reports(resolved);
create index if not exists stockout_reports_barcode_idx on farmalem.stockout_reports(barcode);
