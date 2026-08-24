"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { saveBreakevenMargin } from "@/lib/breakeven";
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
