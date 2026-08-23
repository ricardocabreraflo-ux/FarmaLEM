import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { listPurchases } from "@/lib/purchases";

export interface StockExit {
  id: string;
  exit_date: string;
  barcode: string;
  quantity: number;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface InventoryRow {
  barcode: string;
  shortCode: string | null;
  description: string;
  received: number;
  sold: number;
  available: number;
}

export async function listStockExits(): Promise<StockExit[]> {
  const { data, error } = await supabaseAdmin().from("stock_exits").select().order("exit_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las salidas de inventario: ${error.message}`);
  return data as StockExit[];
}

interface CreateStockExitInput {
  exitDate: string;
  barcode: string;
  quantity: number;
  note: string | null;
  createdBy: string;
}

export async function createStockExit(input: CreateStockExitInput): Promise<void> {
  const { error } = await supabaseAdmin().from("stock_exits").insert({
    exit_date: input.exitDate,
    barcode: input.barcode,
    quantity: input.quantity,
    note: input.note,
    created_by: input.createdBy,
  });
  if (error) throw new Error(error.message);
}

/** Junta lo recibido en Compras con lo dado de salida, agrupado por código de barras. */
export async function getInventorySummary(): Promise<InventoryRow[]> {
  const [purchases, exits] = await Promise.all([listPurchases(), listStockExits()]);

  const rows = new Map<string, InventoryRow>();
  for (const p of purchases) {
    const row = rows.get(p.barcode) ?? { barcode: p.barcode, shortCode: p.short_code, description: p.description, received: 0, sold: 0, available: 0 };
    row.received += p.quantity;
    row.shortCode = p.short_code ?? row.shortCode;
    row.description = p.description;
    rows.set(p.barcode, row);
  }
  for (const e of exits) {
    const row = rows.get(e.barcode);
    if (row) row.sold += e.quantity;
  }
  for (const row of rows.values()) row.available = row.received - row.sold;

  return [...rows.values()].sort((a, b) => a.description.localeCompare(b.description));
}
