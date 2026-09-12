"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createSupplier, updateSupplier } from "@/lib/suppliers";
import { logAction } from "@/lib/history";

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

  await logAction(session.uid, "Creó proveedor", name);
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}

export interface UpdateSupplierResult {
  ok: boolean;
  error?: string;
}

export async function updateSupplierAction(id: string, name: string, contact: string): Promise<UpdateSupplierResult> {
  const session = await requireAdminSession();
  const cleanName = name.trim();
  if (!cleanName) return { ok: false, error: "El nombre del proveedor es obligatorio." };

  try {
    await updateSupplier(id, cleanName, contact.trim() || null);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar el proveedor." };
  }

  await logAction(session.uid, "Editó proveedor", cleanName);
  revalidatePath("/admin/proveedores");
  return { ok: true };
}
