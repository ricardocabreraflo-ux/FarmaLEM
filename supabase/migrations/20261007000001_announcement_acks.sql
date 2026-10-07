-- Confirmación de lectura de los anuncios del banner "Novedades del panel" —
-- quién ya le dio "Ya lo vi" a cada anuncio, para no tener que confiar en que
-- de verdad lo leyeron solo porque apareció en su Inicio.
create table farmalem.announcement_acks (
  announcement_id uuid not null references farmalem.dashboard_announcements(id) on delete cascade,
  employee_id uuid not null references farmalem.profiles(id),
  acked_at timestamptz not null default now(),
  primary key (announcement_id, employee_id)
);
