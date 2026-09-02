import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface Role {
  id: string;
  name: string;
  locked: boolean;
  sort_order: number;
}

/**
 * Catálogo de roles (Configuración > Usuarios). Si la tabla todavía no
 * existe porque no se ha aplicado la migración, no rompe la página —
 * simplemente no hay roles que mostrar todavía.
 */
export async function listRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabaseAdmin().from("roles").select("id, name, locked, sort_order").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    return [];
  }
}

function nextSortOrder(roles: Role[]): number {
  return roles.reduce((max, r) => Math.max(max, r.sort_order), 0) + 10;
}

function uniqueName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

export async function createRole(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Ponle un nombre al rol.");
  const roles = await listRoles();
  const { error } = await supabaseAdmin()
    .from("roles")
    .insert({ name: uniqueName(trimmed, new Set(roles.map((r) => r.name))), sort_order: nextSortOrder(roles) });
  if (error) throw new Error(error.message);
}

export async function renameRole(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Ponle un nombre al rol.");
  const roles = await listRoles();
  const target = roles.find((r) => r.id === id);
  if (!target) throw new Error("Rol desconocido.");
  if (target.locked) throw new Error("Este rol no se puede renombrar.");
  const { error } = await supabaseAdmin().from("roles").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateRole(id: string): Promise<void> {
  const roles = await listRoles();
  const target = roles.find((r) => r.id === id);
  if (!target) throw new Error("Rol desconocido.");
  const name = uniqueName(`${target.name} (copia)`, new Set(roles.map((r) => r.name)));
  const { error } = await supabaseAdmin().from("roles").insert({ name, sort_order: nextSortOrder(roles) });
  if (error) throw new Error(error.message);
}

export async function deleteRole(id: string): Promise<void> {
  const roles = await listRoles();
  const target = roles.find((r) => r.id === id);
  if (!target) throw new Error("Rol desconocido.");
  if (target.locked) throw new Error("Este rol no se puede eliminar.");
  const { error } = await supabaseAdmin().from("roles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
