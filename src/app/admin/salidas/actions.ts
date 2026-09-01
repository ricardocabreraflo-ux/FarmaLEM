"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createWithdrawal, authorizeWithdrawal, type WithdrawalType } from "@/lib/withdrawals";
import { logAction } from "@/lib/history";

export interface WithdrawalFormState {
  error?: string;
}

export async function createWithdrawalForm(_prevState: WithdrawalFormState | undefined, formData: FormData): Promise<WithdrawalFormState> {
  const session = await requireAdminSession();

  const withdrawalDate = String(formData.get("withdrawalDate") ?? "");
  const shift = String(formData.get("shift") ?? "");
  const type = String(formData.get("type") ?? "") as WithdrawalType;
  const amount = Number(formData.get("amount") ?? 0);
  const concept = String(formData.get("concept") ?? "").trim();
  const invoice = String(formData.get("invoice") ?? "").trim();
  const recipient = String(formData.get("recipient") ?? "").trim();
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim();

  if (!withdrawalDate || !shift || !type) return { error: "Fecha, turno y tipo son obligatorios." };
  if (!concept) return { error: "Escribe el concepto de la salida." };
  if (!(amount > 0)) return { error: "La cantidad debe ser mayor a 0." };

  try {
    await createWithdrawal({
      withdrawalDate,
      shift,
      type,
      amount,
      concept,
      invoice: invoice || null,
      recipient: recipient || null,
      supplierId: supplierId || null,
      employeeId: employeeId || null,
      createdBy: session.uid,
      authorizedBy: session.uid,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo registrar la salida." };
  }

  await logAction(session.uid, "Registró salida", `${type} · $${amount.toFixed(2)} · ${concept}`);
  revalidatePath("/admin/salidas");
  redirect("/admin/salidas");
}

export async function authorizeWithdrawalAction(id: string) {
  const session = await requireAdminSession();
  await authorizeWithdrawal(id, session.uid);
  await logAction(session.uid, "Autorizó salida", `#${id.slice(0, 8).toUpperCase()}`);
  revalidatePath("/admin/salidas");
}
