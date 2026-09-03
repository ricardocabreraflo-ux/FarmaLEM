import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { NAV_STRUCTURE, type NavEntryDef, type NavLeafDef } from "@/lib/nav-structure";
import { listRoles, type Role } from "@/lib/roles";

export interface PanelModuleRow {
  key: string;
  enabled: boolean;
  visible_role_ids: string[];
  sort_order: number;
}

/**
 * Lee la configuración guardada. Si la tabla todavía no existe (la
 * migración supabase/migrations/20260902000003_panel_modules.sql no se ha
 * aplicado), el panel sigue funcionando con su comportamiento de siempre
 * en vez de romperse — cada módulo cae de vuelta a su valor por defecto
 * (activo, visible según defaultAdminOnly).
 */
async function getPanelModuleRows(): Promise<Map<string, PanelModuleRow>> {
  try {
    const { data, error } = await supabaseAdmin().from("panel_modules").select("key, enabled, visible_role_ids, sort_order");
    if (error) throw new Error(error.message);
    return new Map((data ?? []).map((r) => [r.key, r as PanelModuleRow]));
  } catch {
    return new Map();
  }
}

/** Para módulos sin fila propia todavía: visible a todos los roles salvo que sean admin-only. */
function rowFor(rows: Map<string, PanelModuleRow>, key: string, allRoleIds: string[], defaultAdminOnly = false): PanelModuleRow {
  return rows.get(key) ?? { key, enabled: true, visible_role_ids: defaultAdminOnly ? [] : allRoleIds, sort_order: 0 };
}

function isLeafVisible(leaf: NavLeafDef, rows: Map<string, PanelModuleRow>, allRoleIds: string[], isAdmin: boolean, roleId: string | null): boolean {
  if (isAdmin) {
    if (leaf.locked) return true;
    return rowFor(rows, leaf.key, allRoleIds, leaf.defaultAdminOnly).enabled;
  }
  if (leaf.locked) return !leaf.defaultAdminOnly;
  const row = rowFor(rows, leaf.key, allRoleIds, leaf.defaultAdminOnly);
  if (!row.enabled) return false;
  if (!roleId) return false;
  return row.visible_role_ids.includes(roleId);
}

// --- Menú resuelto para renderizar el panel (AdminShell) ---------------

export interface ResolvedLeaf {
  type: "leaf";
  key: string;
  href: string;
  label: string;
  iconKey: string;
}

export interface ResolvedGroup {
  type: "group";
  key: string;
  label: string;
  iconKey: string;
  items: ResolvedLeaf[];
}

export type ResolvedNavEntry = ResolvedLeaf | ResolvedGroup;

function toResolvedLeaf(leaf: NavLeafDef): ResolvedLeaf {
  return { type: "leaf", key: leaf.key, href: leaf.href, label: leaf.label, iconKey: leaf.iconKey };
}

/**
 * Menú visible para quien inició sesión. `roleId` es el rol de permisos
 * (Administrador/Supervisor/Vendedor, catálogo de Configuración > Usuarios)
 * asignado a esa persona — decide qué ve dentro de "empleada"; `isAdmin`
 * (el rol de acceso admin/employee de siempre) sigue mandando por encima:
 * administración ve todo sin importar su rol de permisos.
 */
export async function getResolvedNav(isAdmin: boolean, roleId: string | null): Promise<ResolvedNavEntry[]> {
  const [rows, roles] = await Promise.all([getPanelModuleRows(), listRoles()]);
  const allRoleIds = roles.map((r) => r.id);
  const scored: { order: number; entry: ResolvedNavEntry }[] = [];

  for (const entry of NAV_STRUCTURE) {
    if (entry.type === "leaf") {
      if (!isLeafVisible(entry, rows, allRoleIds, isAdmin, roleId)) continue;
      scored.push({ order: rowFor(rows, entry.key, allRoleIds, entry.defaultAdminOnly).sort_order, entry: toResolvedLeaf(entry) });
      continue;
    }
    const groupRow = rowFor(rows, entry.key, allRoleIds);
    if (!groupRow.enabled) continue;
    const items = entry.items
      .filter((item) => isLeafVisible(item, rows, allRoleIds, isAdmin, roleId))
      .sort((a, b) => rowFor(rows, a.key, allRoleIds, a.defaultAdminOnly).sort_order - rowFor(rows, b.key, allRoleIds, b.defaultAdminOnly).sort_order)
      .map(toResolvedLeaf);
    if (items.length === 0) continue;
    scored.push({ order: groupRow.sort_order, entry: { type: "group", key: entry.key, label: entry.label, iconKey: entry.iconKey, items } });
  }

  scored.sort((a, b) => a.order - b.order);
  return scored.map((s) => s.entry);
}

// --- Estructura editable para /admin/configuracion ----------------------

export interface ModuleEditorLeaf {
  type: "leaf";
  key: string;
  label: string;
  locked: boolean;
  defaultAdminOnly: boolean;
  enabled: boolean;
  visibleRoleIds: string[];
}

export interface ModuleEditorGroup {
  type: "group";
  key: string;
  label: string;
  enabled: boolean;
  items: ModuleEditorLeaf[];
}

export type ModuleEditorEntry = ModuleEditorLeaf | ModuleEditorGroup;

function toEditorLeaf(leaf: NavLeafDef, rows: Map<string, PanelModuleRow>, allRoleIds: string[]): ModuleEditorLeaf {
  const row = rowFor(rows, leaf.key, allRoleIds, leaf.defaultAdminOnly);
  return {
    type: "leaf",
    key: leaf.key,
    label: leaf.label,
    locked: Boolean(leaf.locked),
    defaultAdminOnly: leaf.defaultAdminOnly,
    enabled: leaf.locked ? true : row.enabled,
    visibleRoleIds: leaf.locked ? (leaf.defaultAdminOnly ? [] : allRoleIds) : row.visible_role_ids,
  };
}

export async function getModuleEditorStructure(): Promise<{ roles: Role[]; entries: ModuleEditorEntry[] }> {
  const [rows, roles] = await Promise.all([getPanelModuleRows(), listRoles()]);
  const allRoleIds = roles.map((r) => r.id);
  const scored = NAV_STRUCTURE.map((entry): { order: number; entry: ModuleEditorEntry } => {
    if (entry.type === "leaf") return { order: rowFor(rows, entry.key, allRoleIds, entry.defaultAdminOnly).sort_order, entry: toEditorLeaf(entry, rows, allRoleIds) };
    const row = rowFor(rows, entry.key, allRoleIds);
    return {
      order: row.sort_order,
      entry: {
        type: "group",
        key: entry.key,
        label: entry.label,
        enabled: row.enabled,
        items: [...entry.items]
          .sort((a, b) => rowFor(rows, a.key, allRoleIds, a.defaultAdminOnly).sort_order - rowFor(rows, b.key, allRoleIds, b.defaultAdminOnly).sort_order)
          .map((item) => toEditorLeaf(item, rows, allRoleIds)),
      },
    };
  });
  return { roles, entries: scored.sort((a, b) => a.order - b.order).map((s) => s.entry) };
}

// --- Mutaciones -----------------------------------------------------------

function findEntry(key: string): NavEntryDef | NavLeafDef | undefined {
  for (const entry of NAV_STRUCTURE) {
    if (entry.key === key) return entry;
    if (entry.type === "group") {
      const item = entry.items.find((i) => i.key === key);
      if (item) return item;
    }
  }
  return undefined;
}

function siblingKeysOf(key: string): string[] {
  const topKeys = NAV_STRUCTURE.map((e) => e.key);
  if (topKeys.includes(key)) return topKeys;
  for (const entry of NAV_STRUCTURE) {
    if (entry.type === "group" && entry.items.some((i) => i.key === key)) return entry.items.map((i) => i.key);
  }
  return [];
}

export async function updatePanelModule(key: string, patch: { enabled?: boolean; visibleRoleIds?: string[] }): Promise<void> {
  const target = findEntry(key);
  if (!target) throw new Error("Módulo desconocido.");
  if (target.type === "leaf" && target.locked) throw new Error("Este módulo no se puede cambiar — siempre está activo.");

  const update: { enabled?: boolean; visible_role_ids?: string[] } = {};
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.visibleRoleIds !== undefined) update.visible_role_ids = patch.visibleRoleIds;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabaseAdmin().from("panel_modules").upsert({ key, ...update }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

function allLeaves(): NavLeafDef[] {
  return NAV_STRUCTURE.flatMap((entry) => (entry.type === "leaf" ? [entry] : entry.items));
}

/**
 * Guarda de una vez los permisos de un rol para todas las pantallas
 * (botón "Guardar" del modal de permisos por rol) — solo escribe los
 * módulos cuyo estado para este rol realmente cambió.
 */
export async function setRolePermissions(roleId: string, visibleKeys: Set<string>): Promise<void> {
  const [rows, roles] = await Promise.all([getPanelModuleRows(), listRoles()]);
  const allRoleIds = roles.map((r) => r.id);
  const db = supabaseAdmin();

  for (const leaf of allLeaves()) {
    if (leaf.locked) continue;
    const row = rowFor(rows, leaf.key, allRoleIds, leaf.defaultAdminOnly);
    const shouldBeVisible = visibleKeys.has(leaf.key);
    const isVisible = row.visible_role_ids.includes(roleId);
    if (shouldBeVisible === isVisible) continue;

    const nextRoleIds = shouldBeVisible ? [...row.visible_role_ids, roleId] : row.visible_role_ids.filter((id) => id !== roleId);
    const { error } = await db.from("panel_modules").upsert({ key: leaf.key, visible_role_ids: nextRoleIds }, { onConflict: "key" });
    if (error) throw new Error(error.message);
  }
}

export async function movePanelModule(key: string, direction: "up" | "down"): Promise<void> {
  const scopeKeys = siblingKeysOf(key);
  if (scopeKeys.length === 0) throw new Error("Módulo desconocido.");

  const [rows, roles] = await Promise.all([getPanelModuleRows(), listRoles()]);
  const allRoleIds = roles.map((r) => r.id);
  const ordered = scopeKeys.map((k) => ({ key: k, order: rowFor(rows, k, allRoleIds).sort_order })).sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((e) => e.key === key);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];
  const db = supabaseAdmin();
  const { error: e1 } = await db.from("panel_modules").update({ sort_order: b.order }).eq("key", a.key);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await db.from("panel_modules").update({ sort_order: a.order }).eq("key", b.key);
  if (e2) throw new Error(e2.message);
}
