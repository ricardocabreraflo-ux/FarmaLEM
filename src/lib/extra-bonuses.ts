import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type ExtraBonusConcept = "Puntualidad" | "Desempeño" | "Meta de ventas" | "Otro";
export type ExtraBonusStatus = "Pendiente" | "Pagado";

export interface ExtraBonus {
  id: string;
  month: string;
  employee_id: string;
  concept: ExtraBonusConcept;
  amount: number;
  status: ExtraBonusStatus;
  created_by: string;
}

export async function listExtraBonuses(): Promise<ExtraBonus[]> {
  const { data, error } = await supabaseAdmin().from("extra_bonuses").select().order("month", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los bonos extraordinarios: ${error.message}`);
  return data as ExtraBonus[];
}

export async function getExtraBonus(id: string): Promise<ExtraBonus | null> {
  const { data, error } = await supabaseAdmin().from("extra_bonuses").select().eq("id", id).single();
  if (error) return null;
  return data as ExtraBonus;
}

interface ExtraBonusInput {
  month: string;
  employeeId: string;
  concept: ExtraBonusConcept;
  amount: number;
  status: ExtraBonusStatus;
  createdBy: string;
}

export async function saveExtraBonus(input: ExtraBonusInput, id?: string): Promise<void> {
  const row = {
    month: input.month,
    employee_id: input.employeeId,
    concept: input.concept,
    amount: input.amount,
    status: input.status,
    created_by: input.createdBy,
    updated_at: new Date().toISOString(),
  };
  const db = supabaseAdmin();
  const { error } = id ? await db.from("extra_bonuses").update(row).eq("id", id) : await db.from("extra_bonuses").insert(row);
  if (error) throw new Error(error.message);
}
