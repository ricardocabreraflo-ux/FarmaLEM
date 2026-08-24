import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type FinanceMovementType = "Ingreso" | "Costo de venta" | "Gasto fijo" | "Gasto variable" | "Merma";

export interface FinanceMovement {
  id: string;
  movement_date: string;
  type: FinanceMovementType;
  category: string;
  concept: string;
  amount: number;
  created_by: string;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function listFinanceMovementsForMonth(month: string): Promise<FinanceMovement[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabaseAdmin()
    .from("finance_movements")
    .select()
    .gte("movement_date", start)
    .lt("movement_date", end)
    .order("movement_date", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los movimientos financieros: ${error.message}`);
  return data as FinanceMovement[];
}

interface CreateFinanceMovementInput {
  movementDate: string;
  type: FinanceMovementType;
  category: string;
  concept: string;
  amount: number;
  createdBy: string;
}

export async function createFinanceMovement(input: CreateFinanceMovementInput): Promise<void> {
  const { error } = await supabaseAdmin().from("finance_movements").insert({
    movement_date: input.movementDate,
    type: input.type,
    category: input.category,
    concept: input.concept,
    amount: input.amount,
    created_by: input.createdBy,
  });
  if (error) throw new Error(error.message);
}
