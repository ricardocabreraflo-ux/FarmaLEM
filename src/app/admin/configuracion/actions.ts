"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { saveBreakevenMargin } from "@/lib/breakeven";
import { saveDeletePinHash } from "@/lib/security-settings";
import { hashPassword } from "@/lib/password";
import { logAction } from "@/lib/history";
import { getModuleEditorStructure, movePanelModule, updatePanelModule, type ModuleEditorEntry } from "@/lib/panel-modules";
import { createRole, deleteRole, duplicateRole, listRoles, renameRole, type Role } from "@/lib/roles";

export interface BreakevenMarginFormState {
  error?: string;
  saved?: boolean;
}

export async function saveBreakevenMarginForm(_prevState: BreakevenMarginFormState | undefined, formData: FormData): Promise<BreakevenMarginFormState> {
  const session = await requireAdminSession();

  const marginPercent = Number(formData.get("marginPercent") ?? 0) / 100;
  if (!(marginPercent > 0) || marginPercent >= 1) return { error: "El margen debe ser un porcentaje entre 0 y 100." };

  try {
    await saveBreakevenMargin(marginPercent, session.uid);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el margen." };
  }

  await logAction(session.uid, "Actualizó margen de punto de equilibrio", `${(marginPercent * 100).toFixed(1)}%`);
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/punto-equilibrio");
  return { saved: true };
}

export interface DeletePinFormState {
  error?: string;
  saved?: boolean;
}

export async function saveDeletePinForm(_prevState: DeletePinFormState | undefined, formData: FormData): Promise<DeletePinFormState> {
  const session = await requireAdminSession();

  const pin = String(formData.get("pin") ?? "").trim();
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();
  if (!/^\d{4,6}$/.test(pin)) return { error: "El PIN debe ser numérico, de 4 a 6 dígitos." };
  if (pin !== confirmPin) return { error: "Los dos PIN no coinciden." };

  try {
    await saveDeletePinHash(hashPassword(pin));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el PIN." };
  }

  await logAction(session.uid, "Actualizó el PIN de eliminación", "");
  revalidatePath("/admin/configuracion");
  return { saved: true };
}

export interface ModuleActionResult {
  ok: boolean;
  error?: string;
  entries?: ModuleEditorEntry[];
}

const FIELD_LABEL: Record<"enabled" | "visibleEmployee", string> = {
  enabled: "activo",
  visibleEmployee: "visible para vendedor",
};

export async function toggleModuleAction(key: string, field: "enabled" | "visibleEmployee", value: boolean): Promise<ModuleActionResult> {
  const session = await requireAdminSession();
  try {
    await updatePanelModule(key, field === "enabled" ? { enabled: value } : { visibleEmployee: value });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar el módulo." };
  }
  await logAction(session.uid, "Configuró el panel", `${key} · ${FIELD_LABEL[field]}: ${value ? "sí" : "no"}`);
  revalidatePath("/admin/configuracion");
  const entries = await getModuleEditorStructure();
  return { ok: true, entries };
}

export async function moveModuleAction(key: string, direction: "up" | "down"): Promise<ModuleActionResult> {
  const session = await requireAdminSession();
  try {
    await movePanelModule(key, direction);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo mover el módulo." };
  }
  await logAction(session.uid, "Reordenó el panel", `${key} ${direction === "up" ? "subió" : "bajó"}`);
  revalidatePath("/admin/configuracion");
  const entries = await getModuleEditorStructure();
  return { ok: true, entries };
}

export interface RoleActionResult {
  ok: boolean;
  error?: string;
  roles?: Role[];
}

async function afterRoleChange(session: Awaited<ReturnType<typeof requireAdminSession>>, action: string, detail: string): Promise<RoleActionResult> {
  await logAction(session.uid, action, detail);
  revalidatePath("/admin/configuracion");
  const roles = await listRoles();
  return { ok: true, roles };
}

export async function createRoleAction(name: string): Promise<RoleActionResult> {
  const session = await requireAdminSession();
  try {
    await createRole(name);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo crear el rol." };
  }
  return afterRoleChange(session, "Creó un rol", name);
}

export async function renameRoleAction(id: string, name: string): Promise<RoleActionResult> {
  const session = await requireAdminSession();
  try {
    await renameRole(id, name);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo renombrar el rol." };
  }
  return afterRoleChange(session, "Renombró un rol", name);
}

export async function duplicateRoleAction(id: string): Promise<RoleActionResult> {
  const session = await requireAdminSession();
  try {
    await duplicateRole(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo duplicar el rol." };
  }
  return afterRoleChange(session, "Duplicó un rol", id);
}

export async function deleteRoleAction(id: string): Promise<RoleActionResult> {
  const session = await requireAdminSession();
  try {
    await deleteRole(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo eliminar el rol." };
  }
  return afterRoleChange(session, "Eliminó un rol", id);
}
