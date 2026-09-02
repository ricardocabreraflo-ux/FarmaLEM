import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createPurchasesFromReceipt, type ReceiptLineInput } from "@/lib/purchases";
import { upsertEquivalences } from "@/lib/supplier-products";
import type { ParsedTicket } from "@/lib/ticket-types";

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
  created_by: string;
  created_at: string;
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

async function uploadReceiptPhoto(receiptId: string, index: number, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `recepciones/${receiptId}/foto-${index + 1}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin()
    .storage.from(PHOTO_BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: true });
  if (error) throw new Error(`No se pudo subir la foto ${index + 1}: ${error.message}`);
  return path;
}

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
  barcode: string;
  description: string;
  salePrice: number;
  packFactor: number;
}

export interface SaveReceiptInput {
  supplierId: string;
  ticketNumber: string | null;
  ticketDate: string;
  ticketTotal: number | null;
  ticketPieces: number | null;
  ticketSavings: number | null;
  notes: string | null;
  rawExtraction: ParsedTicket | null;
  lines: SaveReceiptLine[];
}

/** Guarda el encabezado, sube las fotos, crea los renglones en purchases y aprende las equivalencias nuevas. */
export async function saveReceipt(input: SaveReceiptInput, photos: File[], createdBy: string): Promise<string> {
  const db = supabaseAdmin();

  const { data: receipt, error: rErr } = await db
    .from("purchase_receipts")
    .insert({
      supplier_id: input.supplierId,
      ticket_number: input.ticketNumber,
      ticket_date: input.ticketDate,
      ticket_total: input.ticketTotal,
      ticket_pieces: input.ticketPieces,
      ticket_savings: input.ticketSavings,
      notes: input.notes,
      raw_extraction: input.rawExtraction,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (rErr) throw new Error(`No se pudo crear la recepción: ${rErr.message}`);
  const receiptId = receipt.id as string;

  if (photos.length > 0) {
    const paths = await Promise.all(photos.map((file, i) => uploadReceiptPhoto(receiptId, i, file)));
    const { error: pErr } = await db.from("purchase_receipts").update({ photo_paths: paths }).eq("id", receiptId);
    if (pErr) throw new Error(`No se pudieron guardar las fotos: ${pErr.message}`);
  }

  const purchaseLines: ReceiptLineInput[] = input.lines.map((l) => ({
    barcode: l.barcode,
    description: l.description,
    quantity: Math.round(l.quantity * l.packFactor * 1000) / 1000,
    cost: Math.round((l.unitPrice / l.packFactor) * 10000) / 10000,
    price: l.salePrice,
    lot: l.lot,
    expiresOn: l.expiresOn,
    packFactor: l.packFactor,
    supplierCode: l.supplierCode,
  }));
  await createPurchasesFromReceipt(receiptId, input.ticketDate, input.supplierId, purchaseLines, createdBy);

  const equivalences = input.lines
    .filter((l): l is SaveReceiptLine & { supplierCode: string } => Boolean(l.supplierCode))
    .map((l) => ({
      supplierId: input.supplierId,
      supplierCode: l.supplierCode,
      supplierDescription: l.ticketDescription,
      barcode: l.barcode,
      description: l.description,
      salePrice: l.salePrice,
      packFactor: l.packFactor,
      lastUnitPrice: l.unitPrice,
    }));
  await upsertEquivalences(equivalences);

  return receiptId;
}
