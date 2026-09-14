import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createPurchaseFromReceiptLine, type ReceiptLineInput } from "@/lib/purchases";
import { upsertEquivalences } from "@/lib/supplier-products";
import type { ParsedTicket } from "@/lib/ticket-types";

export type ReceiptStatus = "Pendiente" | "Completa";

export interface PurchaseReceipt {
  id: string;
  supplier_id: string;
  ticket_number: string | null;
  ticket_date: string;
  ticket_total: number | null;
  ticket_pieces: number | null;
  ticket_savings: number | null;
  photo_paths: string[];
  raw_extraction: ParsedTicket | null;
  notes: string | null;
  status: ReceiptStatus;
  created_by: string;
  created_at: string;
}

/** Un renglón del ticket, resuelto (purchase_id != null, ya es un movimiento real) o pendiente de completar. */
export interface PurchaseReceiptLine {
  id: string;
  receipt_id: string;
  supplier_code: string | null;
  ticket_description: string | null;
  quantity: number;
  unit_price: number;
  lot: string | null;
  expires_on: string | null;
  barcode: string;
  description: string;
  sale_price: number | null;
  pack_factor: number;
  purchase_id: string | null;
}

export async function listReceipts(): Promise<PurchaseReceipt[]> {
  const { data, error } = await supabaseAdmin().from("purchase_receipts").select().order("ticket_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las recepciones: ${error.message}`);
  return data as PurchaseReceipt[];
}

export async function getReceipt(id: string): Promise<PurchaseReceipt | null> {
  const { data, error } = await supabaseAdmin().from("purchase_receipts").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer la recepción: ${error.message}`);
  return data as PurchaseReceipt | null;
}

const PHOTO_BUCKET = "farmalem-documents";

export async function getReceiptPhotoUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabaseAdmin().storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 30);
  if (error) throw new Error(`No se pudieron obtener las fotos: ${error.message}`);
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => Boolean(u));
}

export interface SaveReceiptLine {
  supplierCode: string | null;
  ticketDescription: string | null;
  quantity: number; // unidades del ticket (antes del factor de empaque)
  unitPrice: number; // precio por unidad del ticket
  lot: string | null;
  expiresOn: string | null;
  barcode: string; // vacío si todavía no se resuelve a un producto
  description: string; // vacío si todavía no se resuelve a un producto
  salePrice: number | null; // null si todavía no se resuelve a un producto
  packFactor: number;
}

function isResolved(l: Pick<SaveReceiptLine, "barcode" | "description" | "salePrice" | "quantity">): boolean {
  return Boolean(l.barcode.trim()) && Boolean(l.description.trim()) && l.salePrice != null && l.quantity > 0;
}

function toReceiptLineInput(l: SaveReceiptLine): ReceiptLineInput {
  return {
    barcode: l.barcode,
    description: l.description,
    quantity: Math.round(l.quantity * l.packFactor * 1000) / 1000,
    cost: Math.round((l.unitPrice / l.packFactor) * 10000) / 10000,
    price: l.salePrice as number,
    lot: l.lot,
    expiresOn: l.expiresOn,
    packFactor: l.packFactor,
    supplierCode: l.supplierCode,
  };
}

export async function listReceiptLines(receiptId: string): Promise<PurchaseReceiptLine[]> {
  const { data, error } = await supabaseAdmin().from("purchase_receipt_lines").select().eq("receipt_id", receiptId).order("created_at", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los renglones: ${error.message}`);
  return data as PurchaseReceiptLine[];
}

async function getReceiptLine(id: string): Promise<PurchaseReceiptLine | null> {
  const { data, error } = await supabaseAdmin().from("purchase_receipt_lines").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer el renglón: ${error.message}`);
  return data as PurchaseReceiptLine | null;
}

export interface CompleteReceiptLineInput {
  barcode: string;
  description: string;
  salePrice: number;
  packFactor: number;
}

/** Completa un renglón pendiente: lo vuelve un movimiento real en purchases y, si ya no queda ninguno pendiente, cierra la recepción como "Completa". */
export async function completeReceiptLine(lineId: string, input: CompleteReceiptLineInput, createdBy: string): Promise<void> {
  const db = supabaseAdmin();
  const line = await getReceiptLine(lineId);
  if (!line) throw new Error("Renglón no encontrado.");
  if (line.purchase_id) throw new Error("Ese renglón ya estaba completo.");

  const receipt = await getReceipt(line.receipt_id);
  if (!receipt) throw new Error("Recepción no encontrada.");

  const resolvedLine: SaveReceiptLine = {
    supplierCode: line.supplier_code,
    ticketDescription: line.ticket_description,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    lot: line.lot,
    expiresOn: line.expires_on,
    barcode: input.barcode,
    description: input.description,
    salePrice: input.salePrice,
    packFactor: input.packFactor,
  };
  if (!isResolved(resolvedLine)) throw new Error("Faltan datos: código de barras, descripción o precio de venta.");

  const purchaseId = await createPurchaseFromReceiptLine(line.receipt_id, receipt.ticket_date, receipt.supplier_id, toReceiptLineInput(resolvedLine), createdBy);

  const { error: updErr } = await db
    .from("purchase_receipt_lines")
    .update({ barcode: input.barcode, description: input.description, sale_price: input.salePrice, pack_factor: input.packFactor, purchase_id: purchaseId })
    .eq("id", lineId);
  if (updErr) throw new Error(`No se pudo completar el renglón: ${updErr.message}`);

  if (line.supplier_code) {
    await upsertEquivalences([
      {
        supplierId: receipt.supplier_id,
        supplierCode: line.supplier_code,
        supplierDescription: line.ticket_description,
        barcode: input.barcode,
        description: input.description,
        salePrice: input.salePrice,
        packFactor: input.packFactor,
        lastUnitPrice: line.unit_price,
      },
    ]);
  }

  const remaining = await listReceiptLines(line.receipt_id);
  if (remaining.every((l) => l.purchase_id)) {
    const { error: statusErr } = await db.from("purchase_receipts").update({ status: "Completa" }).eq("id", line.receipt_id);
    if (statusErr) throw new Error(`No se pudo actualizar el estado de la recepción: ${statusErr.message}`);
  }
}

/**
 * Borra una recepción de prueba: sus renglones en purchases (para que dejen
 * de contar en Inventario), sus fotos, y el encabezado. No deshace las
 * equivalencias que haya aprendido en supplier_products — si alguna quedó
 * mal, se corrige a mano la próxima vez que aparezca esa clave.
 */
export async function deleteReceipt(id: string): Promise<void> {
  const db = supabaseAdmin();

  const receipt = await getReceipt(id);
  if (!receipt) throw new Error("Recepción no encontrada.");

  const { error: purchasesErr } = await db.from("purchases").delete().eq("receipt_id", id);
  if (purchasesErr) throw new Error(`No se pudieron borrar los renglones: ${purchasesErr.message}`);

  if (receipt.photo_paths.length > 0) {
    const { error: storageErr } = await db.storage.from(PHOTO_BUCKET).remove(receipt.photo_paths);
    if (storageErr) console.error("[deleteReceipt] no se pudieron borrar las fotos:", storageErr.message);
  }

  const { error: receiptErr } = await db.from("purchase_receipts").delete().eq("id", id);
  if (receiptErr) throw new Error(`No se pudo borrar la recepción: ${receiptErr.message}`);
}

/**
 * Corrige el proveedor de una recepción ya guardada (por ejemplo, si se
 * capturó con el proveedor equivocado). Actualiza tanto el encabezado como
 * los movimientos de compras ya ligados, para que queden consistentes.
 */
export async function updateReceiptSupplier(id: string, supplierId: string): Promise<void> {
  const db = supabaseAdmin();

  const { error: receiptErr } = await db.from("purchase_receipts").update({ supplier_id: supplierId }).eq("id", id);
  if (receiptErr) throw new Error(`No se pudo actualizar el proveedor de la recepción: ${receiptErr.message}`);

  const { error: purchasesErr } = await db.from("purchases").update({ supplier_id: supplierId }).eq("receipt_id", id);
  if (purchasesErr) throw new Error(`No se pudo actualizar el proveedor de los movimientos: ${purchasesErr.message}`);
}

/**
 * Corrige el número de ticket/factura y la fecha de una recepción ya
 * guardada. Actualiza también la fecha de los movimientos de compras ya
 * ligados, para que queden consistentes con el encabezado.
 */
export async function updateReceiptDetails(id: string, ticketNumber: string | null, ticketDate: string): Promise<void> {
  const db = supabaseAdmin();

  const { error: receiptErr } = await db.from("purchase_receipts").update({ ticket_number: ticketNumber, ticket_date: ticketDate }).eq("id", id);
  if (receiptErr) throw new Error(`No se pudo actualizar el ticket: ${receiptErr.message}`);

  const { error: purchasesErr } = await db.from("purchases").update({ purchase_date: ticketDate }).eq("receipt_id", id);
  if (purchasesErr) throw new Error(`No se pudo actualizar la fecha de los movimientos: ${purchasesErr.message}`);
}
