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
