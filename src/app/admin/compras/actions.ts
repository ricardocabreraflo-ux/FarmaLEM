"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createPurchase } from "@/lib/purchases";

export interface PurchaseFormState {
  error?: string;
}

export async function createPurchaseForm(_prevState: PurchaseFormState | undefined, formData: FormData): Promise<PurchaseFormState> {
  const session = await requireAdminSession();

  const purchaseDate = String(formData.get("purchaseDate") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const shortCode = String(formData.get("shortCode") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const cost = Number(formData.get("cost") ?? 0);
  const price = Number(formData.get("price") ?? 0);
  const invoice = String(formData.get("invoice") ?? "").trim();

  if (!purchaseDate || !barcode || !description) return { error: "Fecha, código de barras y descripción son obligatorios." };
  if (!(quantity > 0)) return { error: "Las piezas deben ser mayor a 0." };

  try {
    await createPurchase({
      purchaseDate,
      supplierId: supplierId || null,
      shortCode: shortCode || null,
      barcode,
      description,
      quantity,
      cost,
      price,
      invoice: invoice || null,
      createdBy: session.uid,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el producto." };
  }

  revalidatePath("/admin/compras");
  redirect("/admin/compras");
}
