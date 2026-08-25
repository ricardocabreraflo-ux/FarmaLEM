import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type ExpenseTemplateType = "Gasto fijo" | "Gasto variable";

export interface ExpenseTemplate {
  id: string;
  name: string;
  type: ExpenseTemplateType;
  category: string;
  amount: number;
  active: boolean;
}

export async function listExpenseTemplates(onlyActive = false): Promise<ExpenseTemplate[]> {
  let query = supabaseAdmin().from("expense_templates").select().order("type").order("name");
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los gastos recurrentes: ${error.message}`);
  return data as ExpenseTemplate[];
}

interface CreateExpenseTemplateInput {
  name: string;
  type: ExpenseTemplateType;
  category: string;
  amount: number;
  createdBy: string;
}

export async function createExpenseTemplate(input: CreateExpenseTemplateInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("expense_templates")
    .insert({ name: input.name, type: input.type, category: input.category, amount: input.amount, created_by: input.createdBy, active: true });
  if (error) throw new Error(error.message);
}

export async function setExpenseTemplateActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("expense_templates").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}
