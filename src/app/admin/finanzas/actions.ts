"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createFinanceMovement, type FinanceMovementType } from "@/lib/finance-movements";
import { logAction } from "@/lib/history";

export interface FinanceMovementFormState {
  error?: string;
}

export async function createFinanceMovementForm(_prevState: FinanceMovementFormState | undefined, formData: FormData): Promise<FinanceMovementFormState> {
  const session = await requireAdminSession();

  const movementDate = String(formData.get("movementDate") ?? "");
  const type = String(formData.get("type") ?? "") as FinanceMovementType;
  const category = String(formData.get("category") ?? "").trim();
  const concept = String(formData.get("concept") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const month = movementDate.slice(0, 7);

  if (!movementDate || !type || !category || !concept) return { error: "Completa fecha, tipo, categoría y concepto." };
  if (!(amount >= 0)) return { error: "La cantidad no puede ser negativa." };

  try {
    await createFinanceMovement({ movementDate, type, category, concept, amount, createdBy: session.uid });
    await logAction(session.uid, "Registró movimiento financiero", `${type} · ${concept} · $${amount.toFixed(2)}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el movimiento." };
  }

  revalidatePath("/admin/finanzas");
  redirect(`/admin/finanzas?mes=${month}`);
}
