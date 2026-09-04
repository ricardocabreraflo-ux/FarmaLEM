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
  template_id: string | null;
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

export type FixedExpenseCategory = "renta" | "luzAgua" | "papeleria" | "sistema" | "internet" | "varios";

/**
 * Las categorías de gastos fijos/variables se escriben libres (p. ej. "SICAR X",
 * "Renta del local"), así que para poder mostrarlas en el comparativo anual
 * (que usa columnas fijas heredadas del histórico) se agrupan por palabras clave.
 */
function normalizeFixedExpenseCategory(raw: string): FixedExpenseCategory | null {
  const c = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (c.includes("renta")) return "renta";
  if (c.includes("luz") || c.includes("agua") || c.includes("cfe")) return "luzAgua";
  if (c.includes("papeler")) return "papeleria";
  if (c.includes("sicar") || c.includes("sistema") || c.includes("punto de venta")) return "sistema";
  if (c.includes("internet") || c.includes("telmex") || c.includes("izzi") || c.includes("totalplay")) return "internet";
  if (c.includes("vario")) return "varios";
  return null;
}

/** Suma los movimientos de Gasto fijo/variable de cada mes agrupados por categoría normalizada. Usado por el comparativo anual para meses sin captura manual en el histórico. */
export async function listFixedExpenseCategoryTotals(months: string[]): Promise<Map<string, Partial<Record<FixedExpenseCategory, number>>>> {
  const movementsByMonth = await Promise.all(months.map((m) => listFinanceMovementsForMonth(m)));
  const result = new Map<string, Partial<Record<FixedExpenseCategory, number>>>();
  months.forEach((month, i) => {
    const totals: Partial<Record<FixedExpenseCategory, number>> = {};
    for (const movement of movementsByMonth[i]) {
      if (movement.type !== "Gasto fijo" && movement.type !== "Gasto variable") continue;
      const key = normalizeFixedExpenseCategory(movement.category);
      if (!key) continue;
      totals[key] = (totals[key] ?? 0) + movement.amount;
    }
    result.set(month, totals);
  });
  return result;
}

interface CreateFinanceMovementInput {
  movementDate: string;
  type: FinanceMovementType;
  category: string;
  concept: string;
  amount: number;
  createdBy: string;
  templateId?: string | null;
}

export async function createFinanceMovement(input: CreateFinanceMovementInput): Promise<void> {
  const { error } = await supabaseAdmin().from("finance_movements").insert({
    movement_date: input.movementDate,
    type: input.type,
    category: input.category,
    concept: input.concept,
    amount: input.amount,
    created_by: input.createdBy,
    template_id: input.templateId ?? null,
  });
  if (error) throw new Error(error.message);
}
