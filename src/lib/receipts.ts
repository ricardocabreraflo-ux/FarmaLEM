import { supabase } from "./supabase";
import type {
  DraftLine, ParsedLine, ParsedTicket, Product, Receipt, ReceiptItem, Supplier, SupplierProduct,
} from "./types";

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from("suppliers").select("id,name,legal_name,rfc").eq("active", true).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSupplierCatalog(supplierId: string): Promise<Map<string, SupplierProduct>> {
  const { data, error } = await supabase
    .from("supplier_products")
    .select("id,supplier_id,supplier_code,supplier_description,product_id,pack_factor,last_unit_price,product:products(id,barcode,short_code,name,sale_price,last_cost,stock)")
    .eq("supplier_id", supplierId);
  if (error) throw error;
  const map = new Map<string, SupplierProduct>();
  for (const row of (data ?? []) as unknown as SupplierProduct[]) map.set(row.supplier_code, row);
  return map;
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  const clean = barcode.trim();
  if (!clean) return null;
  const { data, error } = await supabase
    .from("products").select("id,barcode,short_code,name,sale_price,last_cost,stock").eq("barcode", clean).maybeSingle();
  if (error) throw error;
  return data;
}

export async function searchProducts(term: string): Promise<Product[]> {
  const clean = term.trim();
  if (clean.length < 3) return [];
  const { data, error } = await supabase
    .from("products").select("id,barcode,short_code,name,sale_price,last_cost,stock")
    .or(`name.ilike.%${clean}%,barcode.ilike.%${clean}%`).limit(8);
  if (error) throw error;
  return data ?? [];
}

/** Llama a la Edge Function que lee las fotos del ticket. */
export async function parseTicketPhotos(images: { media_type: "image/jpeg"; data: string }[]): Promise<ParsedTicket> {
  const { data, error } = await supabase.functions.invoke("parse-ticket", { body: { images } });
  if (error) {
    let detail = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try { detail = ((await ctx.json()) as { error?: string }).error ?? detail; } catch { /* sin detalle */ }
    }
    throw new Error(detail);
  }
  return (data as { ticket: ParsedTicket }).ticket;
}

let keySeq = 0;
export const newKey = () => `l${Date.now()}-${keySeq++}`;

/** Convierte los renglones leídos en renglones de captura, cruzándolos con el catálogo del proveedor. */
export function buildDraftLines(lines: ParsedLine[], catalog: Map<string, SupplierProduct>): DraftLine[] {
  return lines.map((l) => {
    const base: DraftLine = {
      key: newKey(),
      supplier_code: l.clave ?? "",
      ticket_description: l.descripcion,
      quantity: l.cantidad,
      unit_price: l.precio_unitario,
      lot: l.lote ?? "",
      expires_on: l.caducidad ?? "",
      confianza: l.confianza,
      product_id: null,
      barcode: "",
      product_name: "",
      sale_price: null,
      pack_factor: 1,
      match: "nuevo",
    };
    const hit = l.clave ? catalog.get(l.clave) : undefined;
    if (hit && hit.product) {
      return {
        ...base,
        product_id: hit.product.id,
        barcode: hit.product.barcode,
        product_name: hit.product.name,
        sale_price: hit.product.sale_price,
        pack_factor: hit.pack_factor,
        match: "catalogo",
      };
    }
    return base;
  });
}

export function emptyLine(): DraftLine {
  return {
    key: newKey(), supplier_code: "", ticket_description: "", quantity: 1, unit_price: 0, lot: "", expires_on: "",
    confianza: "alta", product_id: null, barcode: "", product_name: "", sale_price: null, pack_factor: 1, match: "nuevo",
  };
}

export type SaveInput = {
  supplierId: string;
  ticketNumber: string;
  ticketDate: string;
  ticketTotal: number | null;
  ticketPieces: number | null;
  ticketSavings: number | null;
  notes: string;
  rawExtraction: ParsedTicket | null;
  photos: Blob[];
  lines: DraftLine[];
};

/** Guarda la recepción completa y la confirma (actualiza stock, costos y equivalencias). */
export async function saveReceipt(input: SaveInput): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const { data: receipt, error: rErr } = await supabase
    .from("receipts")
    .insert({
      supplier_id: input.supplierId,
      ticket_number: input.ticketNumber || null,
      ticket_date: input.ticketDate,
      ticket_total: input.ticketTotal,
      ticket_pieces: input.ticketPieces,
      ticket_savings: input.ticketSavings,
      notes: input.notes || null,
      raw_extraction: input.rawExtraction,
      created_by: user.user?.id ?? null,
    })
    .select("id").single();
  if (rErr) throw rErr;
  const receiptId = receipt.id as string;

  // Fotos
  const paths: string[] = [];
  for (let i = 0; i < input.photos.length; i++) {
    const path = `${receiptId}/foto-${i + 1}.jpg`;
    const { error } = await supabase.storage.from("tickets").upload(path, input.photos[i], { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    paths.push(path);
  }
  if (paths.length) {
    const { error } = await supabase.from("receipts").update({ photo_paths: paths }).eq("id", receiptId);
    if (error) throw error;
  }

  // Productos nuevos → alta en catálogo propio
  const lines = [...input.lines];
  for (const l of lines) {
    if (l.product_id) continue;
    const barcode = l.barcode.trim();
    const existing = await findProductByBarcode(barcode);
    if (existing) { l.product_id = existing.id; continue; }
    const { data, error } = await supabase
      .from("products")
      .insert({ barcode, name: l.product_name.trim(), sale_price: l.sale_price ?? 0, last_cost: l.unit_price / l.pack_factor })
      .select("id").single();
    if (error) throw error;
    l.product_id = data.id as string;
  }

  const { error: iErr } = await supabase.from("receipt_items").insert(
    lines.map((l, idx) => ({
      receipt_id: receiptId,
      line_no: idx + 1,
      supplier_code: l.supplier_code.trim() || null,
      ticket_description: l.ticket_description.trim() || null,
      quantity: l.quantity,
      unit_price: l.unit_price,
      lot: l.lot.trim() || null,
      expires_on: l.expires_on || null,
      product_id: l.product_id,
      pack_factor: l.pack_factor,
      sale_price: l.sale_price,
    })),
  );
  if (iErr) throw iErr;

  const { error: cErr } = await supabase.rpc("confirm_receipt", { p_receipt_id: receiptId });
  if (cErr) throw cErr;
  return receiptId;
}

export async function fetchReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from("receipts")
    .select("id,supplier_id,ticket_number,ticket_date,ticket_total,ticket_pieces,ticket_savings,status,photo_paths,notes,created_at,supplier:suppliers(id,name,legal_name,rfc)")
    .order("ticket_date", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as Receipt[];
}

export async function fetchReceipt(id: string): Promise<{ receipt: Receipt; items: ReceiptItem[] }> {
  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("id,supplier_id,ticket_number,ticket_date,ticket_total,ticket_pieces,ticket_savings,status,photo_paths,notes,created_at,supplier:suppliers(id,name,legal_name,rfc)")
    .eq("id", id).single();
  if (error) throw error;
  const { data: items, error: iErr } = await supabase
    .from("receipt_items")
    .select("id,receipt_id,line_no,supplier_code,ticket_description,quantity,unit_price,line_total,lot,expires_on,product_id,pack_factor,pieces,unit_cost,sale_price,product:products(id,barcode,short_code,name,sale_price,last_cost,stock)")
    .eq("receipt_id", id).order("line_no");
  if (iErr) throw iErr;
  return { receipt: receipt as unknown as Receipt, items: (items ?? []) as unknown as ReceiptItem[] };
}

export async function photoUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage.from("tickets").createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  return (data ?? []).map((d) => d.signedUrl).filter((u): u is string => Boolean(u));
}
