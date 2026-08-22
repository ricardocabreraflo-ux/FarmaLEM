-- Ejecuta este archivo DESPUÉS de crear manualmente los tres usuarios
-- en Supabase Authentication > Users.

insert into public.farmalem_profiles (
  user_id, username, full_name, role, shift, weekly_salary, shifts_per_week, active
)
select id, 'administracion', 'Administración', 'admin', 'Administración', 0, 7, true
from auth.users where lower(email) = 'administracion@farmalem.local'
on conflict (user_id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  role = excluded.role,
  shift = excluded.shift,
  active = true;

insert into public.farmalem_profiles (
  user_id, username, full_name, role, shift, weekly_salary, shifts_per_week, active
)
select id, 'mariana', 'Mariana Serrano', 'employee', 'Matutino', 1700, 7, true
from auth.users where lower(email) = 'mariana@farmalem.local'
on conflict (user_id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  role = excluded.role,
  shift = excluded.shift,
  weekly_salary = excluded.weekly_salary,
  shifts_per_week = excluded.shifts_per_week,
  active = true;

insert into public.farmalem_profiles (
  user_id, username, full_name, role, shift, weekly_salary, shifts_per_week, active
)
select id, 'itzel', 'Itzel', 'employee', 'Vespertino', 1700, 7, true
from auth.users where lower(email) = 'itzel@farmalem.local'
on conflict (user_id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  role = excluded.role,
  shift = excluded.shift,
  weekly_salary = excluded.weekly_salary,
  shifts_per_week = excluded.shifts_per_week,
  active = true;

do $$
begin
  if (select count(*) from public.farmalem_profiles) < 3 then
    raise exception 'Faltan usuarios. Crea primero administracion@farmalem.local, mariana@farmalem.local e itzel@farmalem.local en Authentication > Users.';
  end if;
end $$;

