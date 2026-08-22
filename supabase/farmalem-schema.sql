-- FarmaLEM: esquema aislado dentro de un proyecto Supabase compartido.
-- No modifica tablas existentes que no comiencen con farmalem_.

create extension if not exists pgcrypto;

create table if not exists public.farmalem_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'employee')),
  shift text not null default 'Matutino',
  weekly_salary numeric(12,2) not null default 1700,
  shifts_per_week integer not null default 7 check (shifts_per_week > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.farmalem_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.farmalem_profiles
    where user_id = auth.uid() and role = 'admin' and active = true
  );
$$;

revoke all on function public.farmalem_is_admin() from public;
grant execute on function public.farmalem_is_admin() to authenticated;

create table if not exists public.farmalem_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farmalem_cuts (
  id uuid primary key default gen_random_uuid(),
  cut_date date not null,
  shift text not null,
  employee_id uuid not null references public.farmalem_profiles(user_id),
  total numeric(12,2) not null check (total >= 0),
  cash numeric(12,2) not null check (cash >= 0),
  card numeric(12,2) not null check (card >= 0),
  cash_delivered numeric(12,2) not null default 0 check (cash_delivered >= 0),
  status text not null default 'Por revisar' check (status in ('Por revisar','Aprobado','Rechazado')),
  photo_path text,
  notes text,
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farmalem_cut_total_check check (abs((cash + card) - total) < 0.01)
);

create unique index if not exists farmalem_cuts_one_shift
  on public.farmalem_cuts(cut_date, shift, employee_id);

create table if not exists public.farmalem_withdrawals (
  id uuid primary key default gen_random_uuid(),
  withdrawal_date date not null,
  shift text not null,
  type text not null check (type in ('Nómina','Gasto','Proveedor','Otro')),
  amount numeric(12,2) not null check (amount > 0),
  concept text not null,
  supplier_id uuid references public.farmalem_suppliers(id),
  invoice text,
  recipient text,
  receipt_path text,
  created_by uuid not null references auth.users(id),
  authorized_by uuid references auth.users(id),
  authorized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farmalem_attendance (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  employee_id uuid not null references public.farmalem_profiles(user_id),
  shift text not null,
  status text not null check (status in ('Asistió','Cubrió turno','Falta','Descanso','Cerrado')),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(work_date, employee_id, shift)
);

create table if not exists public.farmalem_payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.farmalem_profiles(user_id),
  month date not null,
  status text not null default 'Pendiente' check (status in ('Pendiente','Pagado')),
  paid_by uuid references auth.users(id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, month)
);

create table if not exists public.farmalem_bonuses (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  employee_id uuid not null references public.farmalem_profiles(user_id),
  concept text not null check (concept in ('Puntualidad','Desempeño','Meta de ventas','Otro')),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'Pendiente' check (status in ('Pendiente','Pagado')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farmalem_bonus_tiers (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  shift text not null check (shift in ('Matutino','Vespertino')),
  level integer not null check (level between 1 and 4),
  goal numeric(12,2) not null check (goal >= 0),
  bonus numeric(12,2) not null check (bonus >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(month, shift, level)
);

create table if not exists public.farmalem_bonus_weeks (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  week integer not null check (week between 1 and 5),
  employee_id uuid not null references public.farmalem_profiles(user_id),
  shift text not null,
  start_date date not null,
  end_date date not null,
  sales numeric(12,2) not null default 0,
  absent boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(month, week, employee_id),
  check (end_date >= start_date)
);

create table if not exists public.farmalem_purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date not null,
  supplier_id uuid references public.farmalem_suppliers(id),
  short_code text,
  barcode text not null,
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  sale_price numeric(12,2) not null check (sale_price >= 0),
  invoice text,
  receipt_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farmalem_finance_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null,
  type text not null check (type in ('Ingreso','Costo de venta','Gasto operativo')),
  category text not null,
  concept text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farmalem_history (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  action text not null,
  detail text,
  entity text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

alter table public.farmalem_profiles enable row level security;
alter table public.farmalem_suppliers enable row level security;
alter table public.farmalem_cuts enable row level security;
alter table public.farmalem_withdrawals enable row level security;
alter table public.farmalem_attendance enable row level security;
alter table public.farmalem_payroll enable row level security;
alter table public.farmalem_bonuses enable row level security;
alter table public.farmalem_bonus_tiers enable row level security;
alter table public.farmalem_bonus_weeks enable row level security;
alter table public.farmalem_purchases enable row level security;
alter table public.farmalem_finance_movements enable row level security;
alter table public.farmalem_history enable row level security;

drop policy if exists farmalem_profiles_read on public.farmalem_profiles;
create policy farmalem_profiles_read on public.farmalem_profiles for select to authenticated
  using (user_id = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_profiles_admin on public.farmalem_profiles;
create policy farmalem_profiles_admin on public.farmalem_profiles for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_suppliers_read on public.farmalem_suppliers;
create policy farmalem_suppliers_read on public.farmalem_suppliers for select to authenticated
  using (active or public.farmalem_is_admin());
drop policy if exists farmalem_suppliers_admin on public.farmalem_suppliers;
create policy farmalem_suppliers_admin on public.farmalem_suppliers for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_cuts_read on public.farmalem_cuts;
create policy farmalem_cuts_read on public.farmalem_cuts for select to authenticated
  using (employee_id = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_cuts_insert on public.farmalem_cuts;
create policy farmalem_cuts_insert on public.farmalem_cuts for insert to authenticated
  with check (created_by = auth.uid() and (employee_id = auth.uid() or public.farmalem_is_admin()));
drop policy if exists farmalem_cuts_admin_update on public.farmalem_cuts;
create policy farmalem_cuts_admin_update on public.farmalem_cuts for update to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_withdrawals_read on public.farmalem_withdrawals;
create policy farmalem_withdrawals_read on public.farmalem_withdrawals for select to authenticated
  using (created_by = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_withdrawals_insert on public.farmalem_withdrawals;
create policy farmalem_withdrawals_insert on public.farmalem_withdrawals for insert to authenticated
  with check (created_by = auth.uid());
drop policy if exists farmalem_withdrawals_admin_update on public.farmalem_withdrawals;
create policy farmalem_withdrawals_admin_update on public.farmalem_withdrawals for update to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_attendance_read on public.farmalem_attendance;
create policy farmalem_attendance_read on public.farmalem_attendance for select to authenticated
  using (employee_id = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_attendance_admin on public.farmalem_attendance;
create policy farmalem_attendance_admin on public.farmalem_attendance for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_payroll_read on public.farmalem_payroll;
create policy farmalem_payroll_read on public.farmalem_payroll for select to authenticated
  using (employee_id = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_payroll_admin on public.farmalem_payroll;
create policy farmalem_payroll_admin on public.farmalem_payroll for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_bonuses_read on public.farmalem_bonuses;
create policy farmalem_bonuses_read on public.farmalem_bonuses for select to authenticated
  using (employee_id = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_bonuses_admin on public.farmalem_bonuses;
create policy farmalem_bonuses_admin on public.farmalem_bonuses for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_tiers_read on public.farmalem_bonus_tiers;
create policy farmalem_tiers_read on public.farmalem_bonus_tiers for select to authenticated using (true);
drop policy if exists farmalem_tiers_admin on public.farmalem_bonus_tiers;
create policy farmalem_tiers_admin on public.farmalem_bonus_tiers for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_bonus_weeks_read on public.farmalem_bonus_weeks;
create policy farmalem_bonus_weeks_read on public.farmalem_bonus_weeks for select to authenticated
  using (employee_id = auth.uid() or public.farmalem_is_admin());
drop policy if exists farmalem_bonus_weeks_admin on public.farmalem_bonus_weeks;
create policy farmalem_bonus_weeks_admin on public.farmalem_bonus_weeks for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());

drop policy if exists farmalem_purchases_admin on public.farmalem_purchases;
create policy farmalem_purchases_admin on public.farmalem_purchases for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());
drop policy if exists farmalem_finance_admin on public.farmalem_finance_movements;
create policy farmalem_finance_admin on public.farmalem_finance_movements for all to authenticated
  using (public.farmalem_is_admin()) with check (public.farmalem_is_admin());
drop policy if exists farmalem_history_read on public.farmalem_history;
create policy farmalem_history_read on public.farmalem_history for select to authenticated
  using (public.farmalem_is_admin());
drop policy if exists farmalem_history_insert on public.farmalem_history;
create policy farmalem_history_insert on public.farmalem_history for insert to authenticated
  with check (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('farmalem-documents', 'farmalem-documents', false)
on conflict (id) do update set public = false;

drop policy if exists farmalem_storage_read on storage.objects;
create policy farmalem_storage_read on storage.objects for select to authenticated
  using (
    bucket_id = 'farmalem-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.farmalem_is_admin())
  );
drop policy if exists farmalem_storage_insert on storage.objects;
create policy farmalem_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'farmalem-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.farmalem_is_admin())
  );
drop policy if exists farmalem_storage_admin_update on storage.objects;
create policy farmalem_storage_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'farmalem-documents' and public.farmalem_is_admin())
  with check (bucket_id = 'farmalem-documents' and public.farmalem_is_admin());

insert into public.farmalem_bonus_tiers (month, shift, level, goal, bonus)
values
  ('2026-08-01','Matutino',1,4700,150),
  ('2026-08-01','Matutino',2,5700,300),
  ('2026-08-01','Matutino',3,6700,450),
  ('2026-08-01','Matutino',4,7700,600),
  ('2026-08-01','Vespertino',1,6200,150),
  ('2026-08-01','Vespertino',2,7200,300),
  ('2026-08-01','Vespertino',3,8200,450),
  ('2026-08-01','Vespertino',4,9200,600)
on conflict (month, shift, level) do nothing;
