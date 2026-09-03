-- Rotación mensual de responsables de anaqueles (Matutino/Vespertino).
-- El patrón por default se calcula solo (mes non/par) en código — esta
-- tabla solo guarda los meses donde el administrador lo invirtió a mano
-- (ej. vacaciones, cambio de planes). Si un mes no tiene fila aquí, usa
-- el patrón automático.
create table if not exists farmalem.anaqueles_overrides (
  month text primary key, -- 'YYYY-MM'
  set_by uuid,
  set_at timestamptz not null default now()
);
