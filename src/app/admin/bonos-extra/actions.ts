"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { saveExtraBonus, type ExtraBonusConcept, type ExtraBonusStatus } from "@/lib/extra-bonuses";
import { logAction } from "@/lib/history";

export interface ExtraBonusFormState {
  error?: string;
}

export async function saveExtraBonusForm(_prevState: ExtraBonusFormState | undefined, formData: FormData): Promise<ExtraBonusFormState> {
  const session = await requireAdminSession();

  const id = String(formData.get("id") ?? "") || undefined;
  const month = String(formData.get("month") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const concept = String(formData.get("concept") ?? "") as ExtraBonusConcept;
  const amount = Number(formData.get("amount") ?? 0);
  const status = String(formData.get("status") ?? "Pendiente") as ExtraBonusStatus;

  if (!month || !employeeId || !concept) return { error: "Completa mes, empleado y concepto." };
  if (!(amount >= 0)) return { error: "La cantidad no puede ser negativa." };

  try {
    await saveExtraBonus({ month, employeeId, concept, amount, status, createdBy: session.uid }, id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el bono." };
  }

  await logAction(session.uid, id ? "Editó bono extraordinario" : "Registró bono extraordinario", `${concept} · $${amount.toFixed(2)}`);
  revalidatePath("/admin/bonos-extra");
  redirect("/admin/bonos-extra");
}
