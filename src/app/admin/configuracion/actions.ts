"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { saveBreakevenMargin } from "@/lib/breakeven";
import { saveDeletePinHash } from "@/lib/security-settings";
import { hashPassword } from "@/lib/password";
import { logAction } from "@/lib/history";

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
