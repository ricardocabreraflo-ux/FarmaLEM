-- Anuncios de "qué hay de nuevo" en el Inicio del equipo: tarjetas con
-- vista previa (imagen) de funciones recién habilitadas, agregadas a mano
-- cada vez que se lanza algo nuevo (no hay UI de autoservicio para esto).
create table if not exists farmalem.dashboard_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_path text not null,
  href text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_by uuid references farmalem.profiles(id),
  created_at timestamptz not null default now()
);
