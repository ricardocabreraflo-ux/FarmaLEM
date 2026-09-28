-- null/vacío = visible para todo el equipo (como hasta ahora); con roles
-- puestos, solo se le muestra a quien tenga alguno de esos roles de permisos
-- — para anuncios de funciones que no todos los roles tienen habilitadas.
alter table farmalem.dashboard_announcements add column if not exists visible_role_ids uuid[];
