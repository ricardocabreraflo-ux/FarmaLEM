"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { setInventoryCheck, type InventoryCheckShift } from "@/lib/activity-inventory-checks";

export interface SetInventoryCheckResult {
  ok: boolean;
  error?: string;
}

/** Control personal de administración: marcar que ya mandó el inventario de ese día/turno. Nadie más lo ve. */
export async function setInventoryCheckAction(date: string, shift: InventoryCheckShift, value: boolean): Promise<SetInventoryCheckResult> {
  const session = await requireAdminSession();
  try {
    await setInventoryCheck(date, shift, value, session.uid);
    revalidatePath("/admin/actividades");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }
}
