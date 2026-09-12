"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import { parseProductCatalogWorkbook, replaceProductCatalog } from "@/lib/product-catalog";

export interface UploadCatalogResult {
  ok: boolean;
  count?: number;
  error?: string;
}

export async function uploadCatalogAction(formData: FormData): Promise<UploadCatalogResult> {
  const session = await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Selecciona el archivo del catálogo." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseProductCatalogWorkbook(buffer);
    if (rows.length === 0) return { ok: false, error: "El archivo no trae renglones con clave y descripción." };

    const count = await replaceProductCatalog(rows);
    await logAction(session.uid, "Actualizó catálogo de productos", `${count} productos`);
    revalidatePath("/admin/catalogo");
    return { ok: true, count };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo procesar el archivo." };
  }
}
