-- Control personal de administración: qué inventario del día (matutino o
-- vespertino) ya se mandó/revisó. Nada más para su seguimiento — no afecta
-- lo que ve el equipo ni la rotación de categorías. Que exista la fila es
-- "ya lo marqué"; se borra al desmarcar.
create table farmalem.activity_inventory_checks (
  check_date date not null,
  shift text not null check (shift in ('Matutino', 'Vespertino')),
  checked_by uuid not null references farmalem.profiles(id),
  checked_at timestamptz not null default now(),
  primary key (check_date, shift)
);
