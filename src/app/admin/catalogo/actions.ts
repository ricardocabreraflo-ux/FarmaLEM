"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";

/** El archivo en sí se sube directo a la Edge Function (ver catalog-upload-client.ts); esto solo registra el historial y refresca la página. */
export async function logCatalogUploadAction(count: number): Promise<void> {
  const session = await requireAdminSession();
  await logAction(session.uid, "Actualizó catálogo de productos", `${count} productos`);
  revalidatePath("/admin/catalogo");
}
