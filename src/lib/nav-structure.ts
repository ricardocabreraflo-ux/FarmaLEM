/**
 * Estructura fija del menú del panel: qué pantallas existen, cómo se llaman,
 * su ícono y a qué grupo pertenecen. Lo que SÍ se puede cambiar sin tocar
 * código (activo/inactivo, visible para vendedor, orden) vive en la tabla
 * farmalem.panel_modules y se resuelve en src/lib/panel-modules.ts.
 */

export interface NavLeafDef {
  type: "leaf";
  key: string;
  href: string;
  label: string;
  iconKey: string;
  defaultAdminOnly: boolean;
  /** No se puede desactivar ni ocultar al vendedor — evita quedarse sin acceso al panel. */
  locked?: boolean;
}

export interface NavGroupDef {
  type: "group";
  key: string;
  id: string;
  label: string;
  iconKey: string;
  items: NavLeafDef[];
}

export type NavEntryDef = NavLeafDef | NavGroupDef;

function leaf(href: string, label: string, iconKey: string, defaultAdminOnly = false, locked = false): NavLeafDef {
  return { type: "leaf", key: href, href, label, iconKey, defaultAdminOnly, locked };
}

function group(id: string, label: string, iconKey: string, items: NavLeafDef[]): NavGroupDef {
  return { type: "group", key: `group:${id}`, id, label, iconKey, items };
}

export const NAV_STRUCTURE: NavEntryDef[] = [
  leaf("/admin/inicio", "Inicio", "IconInicio", false, true),
  leaf("/admin", "Pedidos", "IconPedidos", true),
  group("caja", "Caja", "IconCaja", [
    leaf("/admin/cortes", "Cortes", "IconCortes"),
    leaf("/admin/salidas", "Salidas de efectivo", "IconSalidas", true),
  ]),
  group("personal", "Personal", "IconEmpleados", [
    leaf("/admin/asistencia", "Asistencia", "IconAsistencia", true),
    leaf("/admin/asistencia/calendario", "Calendario de turnos", "IconCalendario", true),
    leaf("/admin/reloj", "Reloj checador", "IconReloj"),
    leaf("/admin/bonos-extra", "Bonos extraordinarios", "IconBonoExtra", true),
    leaf("/admin/bonos", "Bonos semanales", "IconBonoSemanal", true),
    leaf("/admin/empleados", "Empleados", "IconEmpleados", true),
    leaf("/admin/sueldos", "Sueldos y salarios", "IconSueldos", true),
  ]),
  group("mercancia", "Mercancía", "IconMercancia", [
    leaf("/admin/inventario", "Inventario", "IconInventario", true),
    leaf("/admin/proveedores", "Proveedores", "IconProveedores", true),
    leaf("/admin/compras", "Recepción de mercancía", "IconCompras", true),
  ]),
  group("finanzas", "Finanzas", "IconFinanzas", [
    leaf("/admin/ventas", "Comparativa de ventas", "IconVentas", true),
    leaf("/admin/finanzas", "Estado de resultados", "IconFinanzas", true),
    leaf("/admin/finanzas/gastos", "Gastos fijos y variables", "IconGastos", true),
    leaf("/admin/punto-equilibrio", "Punto de equilibrio", "IconBalance", true),
    leaf("/admin/punto-equilibrio/simulador", "Simulador de escenarios", "IconSliders", true),
  ]),
  leaf("/admin/historial", "Historial", "IconHistorial", true),
  leaf("/admin/configuracion", "Configuración", "IconSettings", true, true),
];
