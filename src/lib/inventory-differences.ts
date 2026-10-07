import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type InventoryDifferenceKind = "Faltante" | "Sobrante";
export type InventoryDifferenceShift = "Matutino" | "Vespertino";

export interface InventoryDifference {
  id: string;
  diff_date: string;
  category: string;
  shift: InventoryDifferenceShift;
  kind: InventoryDifferenceKind;
  barcode: string | null;
  description: string;
  unit_price: number | null;
  quantity: number;
  amount: number | null;
  observations: string | null;
  cashier_id: string;
  created_by: string;
  settled: boolean;
  settled_at: string | null;
  settled_by: string | null;
  created_at: string;
}

export async function listInventoryDifferences(onlyCashierId?: string): Promise<InventoryDifference[]> {
  let query = supabaseAdmin().from("inventory_differences").select().order("diff_date", { ascending: false }).order("created_at", { ascending: false });
  if (onlyCashierId) query = query.eq("cashier_id", onlyCashierId);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer las diferencias: ${error.message}`);
  return data as InventoryDifference[];
}

export interface CreateInventoryDifferenceInput {
  diffDate: string;
  category: string;
  shift: InventoryDifferenceShift;
  kind: InventoryDifferenceKind;
  barcode: string | null;
  description: string;
  unitPrice: number | null;
  quantity: number;
  observations: string | null;
  cashierId: string;
}

export async function createInventoryDifference(input: CreateInventoryDifferenceInput, createdBy: string): Promise<void> {
  const amount = input.kind === "Faltante" && input.unitPrice != null ? Math.round(input.unitPrice * input.quantity * 100) / 100 : null;
  const { error } = await supabaseAdmin().from("inventory_differences").insert({
    diff_date: input.diffDate,
    category: input.category,
    shift: input.shift,
    kind: input.kind,
    barcode: input.barcode,
    description: input.description,
    unit_price: input.unitPrice,
    quantity: input.quantity,
    amount,
    observations: input.observations,
    cashier_id: input.cashierId,
    created_by: createdBy,
  });
  if (error) throw new Error(`No se pudo guardar la diferencia: ${error.message}`);
}

export async function deleteInventoryDifference(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("inventory_differences").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
}

/** Lo que cada cajero debe (solo Faltante sin liquidar) — para la tarjeta de saldo por persona. */
export async function getPendingBalanceByCashier(): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin().from("inventory_differences").select("cashier_id, amount").eq("kind", "Faltante").eq("settled", false);
  if (error) throw new Error(`No se pudo calcular el saldo: ${error.message}`);
  const balances = new Map<string, number>();
  for (const row of (data ?? []) as { cashier_id: string; amount: number | null }[]) {
    balances.set(row.cashier_id, (balances.get(row.cashier_id) ?? 0) + (row.amount ?? 0));
  }
  return balances;
}

/** Marca como pagado todo lo pendiente (Faltante sin liquidar) de ese cajero de un jalón — "ya me entregó lo que debía". */
export async function settlePendingForCashier(cashierId: string, settledBy: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("inventory_differences")
    .update({ settled: true, settled_at: new Date().toISOString(), settled_by: settledBy })
    .eq("cashier_id", cashierId)
    .eq("kind", "Faltante")
    .eq("settled", false);
  if (error) throw new Error(`No se pudo marcar como pagado: ${error.message}`);
}
