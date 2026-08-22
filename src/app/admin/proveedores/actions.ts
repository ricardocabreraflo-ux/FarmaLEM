"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createSupplier } from "@/lib/suppliers";

export interface SupplierFormState {
  error?: string;
}

export async function createSupplierForm(_prevState: SupplierFormState | undefined, formData: FormData): Promise<SupplierFormState> {
  const session = await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  if (!name) return { error: "El nombre del proveedor es obligatorio." };

  try {
    await createSupplier(name, contact || null, session.uid);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el proveedor." };
  }

  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}
