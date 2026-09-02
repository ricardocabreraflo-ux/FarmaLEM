import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface Purchase {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  short_code: string | null;
  barcode: string;
  description: string;
  quantity: number;
  cost: number;
  price: number;
  invoice: string | null;
  lot: string | null;
  expires_on: string | null;
  pack_factor: number;
  supplier_code: string | null;
  receipt_id: string | null;
  created_by: string;
  created_at: string;
}

export async function listPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabaseAdmin().from("purchases").select().order("purchase_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las compras: ${error.message}`);
  return data as Purchase[];
}

interface CreatePurchaseInput {
  purchaseDate: string;
  supplierId: string | null;
  shortCode: string | null;
  barcode: string;
  description: string;
  quantity: number;
  cost: number;
  price: number;
  invoice: string | null;
  createdBy: string;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<void> {
  const { error } = await supabaseAdmin().from("purchases").insert({
    purchase_date: input.purchaseDate,
    supplier_id: input.supplierId,
    short_code: input.shortCode,
    barcode: input.barcode,
    description: input.description,
    quantity: input.quantity,
    cost: input.cost,
    price: input.price,
    invoice: input.invoice,
    created_by: input.createdBy,
  });
  if (error) throw new Error(error.message);
}

/** El renglón más reciente con ese código de barras (de cualquier proveedor), para autocompletar un producto ya conocido. */
export async function findLatestPurchaseByBarcode(barcode: string): Promise<Purchase | null> {
  const clean = barcode.trim();
  if (!clean) return null;
  const { data, error } = await supabaseAdmin()
    .from("purchases")
    .select()
    .eq("barcode", clean)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo buscar el código de barras: ${error.message}`);
  return data as Purchase | null;
}

export interface ReceiptLineInput {
  barcode: string;
  description: string;
  quantity: number; // piezas FarmaLEM (cantidad del ticket × factor de empaque)
  cost: number; // costo por pieza
  price: number;
  lot: string | null;
  expiresOn: string | null;
  packFactor: number;
  supplierCode: string | null;
}

/** Inserta todos los renglones de una recepción como filas de purchases, ligadas al ticket. */
export async function createPurchasesFromReceipt(
  receiptId: string,
  purchaseDate: string,
  supplierId: string,
  lines: ReceiptLineInput[],
  createdBy: string
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("purchases")
    .insert(
      lines.map((l) => ({
        purchase_date: purchaseDate,
        supplier_id: supplierId,
        short_code: null,
        barcode: l.barcode,
        description: l.description,
        quantity: l.quantity,
        cost: l.cost,
        price: l.price,
        invoice: null,
        lot: l.lot,
        expires_on: l.expiresOn,
        pack_factor: l.packFactor,
        supplier_code: l.supplierCode,
        receipt_id: receiptId,
        created_by: createdBy,
      }))
    );
  if (error) throw new Error(`No se pudieron guardar los renglones: ${error.message}`);
}

export async function listPurchasesForReceipt(receiptId: string): Promise<Purchase[]> {
  const { data, error } = await supabaseAdmin().from("purchases").select().eq("receipt_id", receiptId).order("created_at", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los renglones: ${error.message}`);
  return data as Purchase[];
}
