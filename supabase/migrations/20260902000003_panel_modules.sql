-- Configuración del panel: qué módulos se ven, para quién, y en qué orden.
-- La estructura (label, ícono, a qué grupo pertenece) sigue viviendo en el
-- código (src/lib/nav-structure.ts); esta tabla solo guarda los ajustes que
-- el administrador puede cambiar desde Configuración.
create table if not exists farmalem.panel_modules (
  key text primary key,
  enabled boolean not null default true,
  visible_employee boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Valores iniciales que reproducen el menú actual (orden y visibilidad por
-- rol tal como estaban escritos en AdminShell antes de hacerse configurables).
insert into farmalem.panel_modules (key, enabled, visible_employee, sort_order) values
  ('/admin/inicio', true, true, 10),
  ('/admin', true, false, 20),
  ('group:caja', true, true, 30),
  ('/admin/cortes', true, true, 10),
  ('/admin/salidas', true, false, 20),
  ('group:personal', true, true, 40),
  ('/admin/asistencia', true, false, 10),
  ('/admin/asistencia/calendario', true, false, 20),
  ('/admin/reloj', true, true, 30),
  ('/admin/bonos-extra', true, false, 40),
  ('/admin/bonos', true, false, 50),
  ('/admin/empleados', true, false, 60),
  ('/admin/sueldos', true, false, 70),
  ('group:mercancia', true, true, 50),
  ('/admin/inventario', true, false, 10),
  ('/admin/proveedores', true, false, 20),
  ('/admin/compras', true, false, 30),
  ('group:finanzas', true, true, 60),
  ('/admin/ventas', true, false, 10),
  ('/admin/finanzas', true, false, 20),
  ('/admin/finanzas/gastos', true, false, 30),
  ('/admin/punto-equilibrio', true, false, 40),
  ('/admin/punto-equilibrio/simulador', true, false, 50),
  ('/admin/ayuda', true, true, 65),
  ('/admin/historial', true, false, 70),
  ('/admin/configuracion', true, false, 80)
on conflict (key) do nothing;
