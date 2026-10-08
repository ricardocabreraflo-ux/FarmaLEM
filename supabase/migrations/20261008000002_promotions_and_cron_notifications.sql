-- Promociones del día: Ricardo las captura y activa aquí; las activas se
-- mandan por push a quien checa su Entrada ese día.
create table farmalem.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  active boolean not null default true,
  created_by uuid not null references farmalem.profiles(id),
  created_at timestamptz not null default now()
);
