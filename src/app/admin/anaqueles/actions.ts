"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { setShelfOverride, clearShelfOverride } from "@/lib/anaqueles";
import { logAction } from "@/lib/history";

export interface AnaquelesActionResult {
  ok: boolean;
  error?: string;
}

export async function setShelfOverrideAction(month: string): Promise<AnaquelesActionResult> {
  const session = await requireAdminSession();
  try {
    await setShelfOverride(month, session.uid);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cambiar el turno." };
  }
  await logAction(session.uid, "Cambió a mano el turno de anaqueles", month);
  revalidatePath("/admin/anaqueles");
  return { ok: true };
}

export async function clearShelfOverrideAction(month: string): Promise<AnaquelesActionResult> {
  const session = await requireAdminSession();
  try {
    await clearShelfOverride(month);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo quitar el cambio." };
  }
  await logAction(session.uid, "Quitó el cambio manual de anaqueles", month);
  revalidatePath("/admin/anaqueles");
  return { ok: true };
}
