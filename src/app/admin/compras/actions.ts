"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import { listSupplierCatalog, type SupplierProduct } from "@/lib/supplier-products";
import { findLatestPurchaseByBarcode } from "@/lib/purchases";
import { deleteReceipt, completeReceiptLine, updateReceiptSupplier, updateReceiptDetails } from "@/lib/purchase-receipts";
import { getCatalogEntryByBarcode } from "@/lib/product-catalog";
import { createSupplier } from "@/lib/suppliers";

export interface CreateSupplierResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Da de alta un proveedor nuevo al vuelo, desde la pantalla de nueva recepción. */
export async function createSupplierAction(name: string): Promise<CreateSupplierResult> {
  const session = await requireAdminSession();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Ponle un nombre al proveedor." };

  try {
    const id = await createSupplier(trimmed, null, session.uid);
    await logAction(session.uid, "Creó proveedor", trimmed);
    revalidatePath("/admin/proveedores");
    revalidatePath("/admin/compras/nuevo");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo crear el proveedor." };
  }
}

export async function fetchSupplierCatalogAction(supplierId: string): Promise<SupplierProduct[]> {
  await requireAdminSession();
  if (!supplierId) return [];
  const map = await listSupplierCatalog(supplierId);
  return [...map.values()];
}

export interface KnownProduct {
  barcode: string;
  description: string;
  salePrice: number;
}

/**
 * Busca ese código de barras — primero en lo que ya se ha recibido antes
 * (refleja la descripción/precio que ya se usa en FarmaLEM), y si no, en el
 * catálogo de referencia de SICAR X, para no volver a capturar la
 * descripción/precio de un producto que ya conocemos aunque nunca se haya
 * recibido en el panel.
 */
export async function findByBarcodeAction(barcode: string): Promise<KnownProduct | null> {
  await requireAdminSession();
  const purchase = await findLatestPurchaseByBarcode(barcode);
  if (purchase) return { barcode: purchase.barcode, description: purchase.description, salePrice: purchase.price };

  const catalogEntry = await getCatalogEntryByBarcode(barcode);
  if (!catalogEntry) return null;
  const salePrice = catalogEntry.sale_price_net ?? catalogEntry.sale_price;
  if (salePrice == null) return null;
  return { barcode: catalogEntry.barcode, description: catalogEntry.description, salePrice };
}

export interface CompleteLineResult {
  ok: boolean;
  error?: string;
}

/** Completa un renglón pendiente de una recepción (código de barras, descripción y precio de venta) y lo vuelve un movimiento real de compras. */
export async function completeReceiptLineAction(
  lineId: string,
  input: { barcode: string; description: string; salePrice: number; packFactor: number }
): Promise<CompleteLineResult> {
  const session = await requireAdminSession();
  const barcode = input.barcode.trim();
  const description = input.description.trim();
  if (!barcode) return { ok: false, error: "Falta el código de barras." };
  if (!description) return { ok: false, error: "Falta la descripción." };
  if (!(input.salePrice >= 0)) return { ok: false, error: "El precio de venta no es válido." };
  if (!(input.packFactor >= 1)) return { ok: false, error: "El factor de empaque no es válido." };

  try {
    await completeReceiptLine(lineId, { barcode, description, salePrice: input.salePrice, packFactor: input.packFactor }, session.uid);
    await logAction(session.uid, "Completó renglón de recepción", `${barcode} · ${description}`);
    revalidatePath("/admin/compras");
    revalidatePath("/admin/inventario");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo completar el renglón." };
  }
}

export interface UpdateReceiptSupplierResult {
  ok: boolean;
  error?: string;
}

/** Corrige el proveedor de una recepción ya guardada (encabezado y movimientos ligados). */
export async function updateReceiptSupplierAction(receiptId: string, supplierId: string): Promise<UpdateReceiptSupplierResult> {
  const session = await requireAdminSession();
  if (!supplierId) return { ok: false, error: "Selecciona el proveedor." };

  try {
    await updateReceiptSupplier(receiptId, supplierId);
    await logAction(session.uid, "Corrigió proveedor de recepción", `#${receiptId.slice(0, 8).toUpperCase()}`);
    revalidatePath("/admin/compras");
    revalidatePath(`/admin/compras/${receiptId}`);
    revalidatePath("/admin/inventario");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar el proveedor." };
  }
}

export interface UpdateReceiptDetailsResult {
  ok: boolean;
  error?: string;
}

/** Corrige el número de ticket/factura y la fecha de una recepción ya guardada. */
export async function updateReceiptDetailsAction(receiptId: string, ticketNumber: string, ticketDate: string): Promise<UpdateReceiptDetailsResult> {
  const session = await requireAdminSession();
  if (!ticketDate) return { ok: false, error: "Falta la fecha del ticket." };

  try {
    await updateReceiptDetails(receiptId, ticketNumber.trim() || null, ticketDate);
    await logAction(session.uid, "Corrigió datos de recepción", `#${receiptId.slice(0, 8).toUpperCase()} · ${ticketNumber.trim() || "s/n"} · ${ticketDate}`);
    revalidatePath("/admin/compras");
    revalidatePath(`/admin/compras/${receiptId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudieron actualizar los datos del ticket." };
  }
}

export interface DeleteReceiptResult {
  ok: boolean;
  error?: string;
}

/** Borra una recepción (renglones, fotos y encabezado) — para quitar pruebas. */
export async function deleteReceiptAction(id: string): Promise<DeleteReceiptResult> {
  const session = await requireAdminSession();
  try {
    await deleteReceipt(id);
    await logAction(session.uid, "Borró recepción de mercancía", `#${id.slice(0, 8).toUpperCase()}`);
    revalidatePath("/admin/compras");
    revalidatePath("/admin/inventario");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo borrar la recepción." };
  }
}
