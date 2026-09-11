"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import type { ParsedTicket } from "@/lib/ticket-types";
import { listSupplierCatalog, type SupplierProduct } from "@/lib/supplier-products";
import { findLatestPurchaseByBarcode } from "@/lib/purchases";
import { saveReceipt, deleteReceipt, completeReceiptLine, type SaveReceiptLine } from "@/lib/purchase-receipts";

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

/** Busca si ese código de barras ya se recibió antes (de cualquier proveedor), para no volver a capturar la descripción/precio. */
export async function findByBarcodeAction(barcode: string): Promise<KnownProduct | null> {
  await requireAdminSession();
  const purchase = await findLatestPurchaseByBarcode(barcode);
  if (!purchase) return null;
  return { barcode: purchase.barcode, description: purchase.description, salePrice: purchase.price };
}

export interface SaveReceiptResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Guarda la recepción completa: encabezado, fotos, renglones (piezas/costo) y equivalencias nuevas del proveedor. */
export async function saveReceiptAction(formData: FormData): Promise<SaveReceiptResult> {
  const session = await requireAdminSession();

  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const ticketDate = String(formData.get("ticketDate") ?? "");
  if (!supplierId) return { ok: false, error: "Selecciona el proveedor." };
  if (!ticketDate) return { ok: false, error: "Falta la fecha del ticket." };

  let lines: SaveReceiptLine[];
  try {
    lines = JSON.parse(String(formData.get("lines") ?? "[]")) as SaveReceiptLine[];
  } catch {
    return { ok: false, error: "Los renglones capturados no son válidos." };
  }
  if (lines.length === 0) return { ok: false, error: "No hay renglones que guardar." };
  if (lines.some((l) => !(l.quantity > 0))) return { ok: false, error: "Hay un renglón con cantidad inválida." };

  const numOrNull = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? Number(v) : null);
  const photos = formData.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  let rawExtraction: ParsedTicket | null = null;
  const rawExtractionStr = String(formData.get("rawExtraction") ?? "");
  if (rawExtractionStr) {
    try {
      rawExtraction = JSON.parse(rawExtractionStr) as ParsedTicket;
    } catch {
      rawExtraction = null;
    }
  }

  try {
    const id = await saveReceipt(
      {
        supplierId,
        ticketNumber: String(formData.get("ticketNumber") ?? "").trim() || null,
        ticketDate,
        ticketTotal: numOrNull(formData.get("ticketTotal")),
        ticketPieces: numOrNull(formData.get("ticketPieces")),
        ticketSavings: numOrNull(formData.get("ticketSavings")),
        notes: String(formData.get("notes") ?? "").trim() || null,
        rawExtraction,
        lines,
      },
      photos,
      session.uid
    );

    const totalPieces = lines.reduce((sum, l) => sum + l.quantity * l.packFactor, 0);
    await logAction(session.uid, "Recibió mercancía", `Ticket ${formData.get("ticketNumber") || "s/n"} · ${lines.length} renglones · ${totalPieces} piezas`);
    revalidatePath("/admin/compras");
    revalidatePath("/admin/inventario");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar la recepción." };
  }
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
