-- Estados de resultados históricos, capturados a mano desde el Excel viejo
-- (meses de antes de que el panel llevara todo digital). Una vez que el
-- administrador los aprueba quedan fijos — la app respeta ese flag, no hay
-- constraint de base de datos que lo haga cumplir.
create table if not exists farmalem.historical_income_statements (
  month text primary key, -- 'YYYY-MM'
  ventas numeric not null default 0,
  costos numeric not null default 0,
  gasto_renta numeric not null default 0,
  gasto_luz_agua numeric not null default 0,
  gasto_bonos numeric not null default 0,
  gasto_sueldos numeric not null default 0,
  gasto_varios numeric not null default 0,
  gasto_papeleria numeric not null default 0,
  gasto_sistema numeric not null default 0,
  gasto_internet numeric not null default 0,
  perdidas_merma numeric not null default 0,
  approved boolean not null default false,
  approved_by uuid,
  approved_at timestamptz,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
