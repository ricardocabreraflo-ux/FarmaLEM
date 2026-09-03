-- Cada empleada se asigna a uno de los roles del catálogo (Administrador/
-- Supervisor/Vendedor) para decidir qué ve en el menú — separado del
-- campo "role" (admin/employee) que sigue controlando el login.
alter table farmalem.profiles add column if not exists role_id uuid references farmalem.roles(id);

update farmalem.profiles set role_id = (select id from farmalem.roles where name = 'ADMINISTRADOR')
where role = 'admin' and role_id is null;

update farmalem.profiles set role_id = (select id from farmalem.roles where name = 'VENDEDOR')
where role = 'employee' and role_id is null;

-- panel_modules pasa de un solo interruptor "visible_employee" a una
-- lista de roles que sí lo ven. Se conserva visible_employee por ahora
-- (sin usarse) para no romper nada si algo todavía lo lee.
alter table farmalem.panel_modules add column if not exists visible_role_ids uuid[] not null default '{}';

update farmalem.panel_modules
set visible_role_ids = (select array_agg(id) from farmalem.roles)
where visible_employee = true;
