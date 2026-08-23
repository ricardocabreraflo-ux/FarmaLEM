"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createStockExit } from "@/lib/inventory";
import { logAction } from "@/lib/history";

export interface StockExitFormState {
  error?: string;
}

export async function createStockExitForm(_prevState: StockExitFormState | undefined, formData: FormData): Promise<StockExitFormState> {
  const session = await requireAdminSession();

  const exitDate = String(formData.get("exitDate") ?? "");
  const barcode = String(formData.get("barcode") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!exitDate || !barcode) return { error: "Fecha y producto son obligatorios." };
  if (!(quantity > 0)) return { error: "Las piezas deben ser mayor a 0." };

  try {
    await createStockExit({ exitDate, barcode, quantity, note: note || null, createdBy: session.uid });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar la salida." };
  }

  await logAction(session.uid, "Registró salida de inventario", `${barcode} · ${quantity} piezas`);
  revalidatePath("/admin/inventario");
  redirect("/admin/inventario");
}
