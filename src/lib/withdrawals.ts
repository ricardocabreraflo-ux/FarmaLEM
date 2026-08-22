import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type WithdrawalType = "Nómina" | "Gasto" | "Proveedor" | "Otro";

export interface Withdrawal {
  id: string;
  withdrawal_date: string;
  shift: string;
  type: WithdrawalType;
  amount: number;
  concept: string;
  invoice: string | null;
  recipient: string | null;
  supplier_id: string | null;
  created_by: string;
  authorized_by: string | null;
  authorized_at: string | null;
  created_at: string;
}

export async function listWithdrawals(onlyCreatedBy?: string): Promise<Withdrawal[]> {
  let query = supabaseAdmin().from("withdrawals").select().order("withdrawal_date", { ascending: false }).order("created_at", { ascending: false });
  if (onlyCreatedBy) query = query.eq("created_by", onlyCreatedBy);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer las salidas de efectivo: ${error.message}`);
  return data as Withdrawal[];
}

interface CreateWithdrawalInput {
  withdrawalDate: string;
  shift: string;
  type: WithdrawalType;
  amount: number;
  concept: string;
  invoice: string | null;
  recipient: string | null;
  supplierId: string | null;
  createdBy: string;
  authorizedBy: string | null;
}

export async function createWithdrawal(input: CreateWithdrawalInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("withdrawals")
    .insert({
      withdrawal_date: input.withdrawalDate,
      shift: input.shift,
      type: input.type,
      amount: input.amount,
      concept: input.concept,
      invoice: input.invoice,
      recipient: input.recipient,
      supplier_id: input.supplierId,
      created_by: input.createdBy,
      authorized_by: input.authorizedBy,
      authorized_at: input.authorizedBy ? new Date().toISOString() : null,
    });
  if (error) throw new Error(error.message);
}

export async function authorizeWithdrawal(id: string, authorizedBy: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("withdrawals")
    .update({ authorized_by: authorizedBy, authorized_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo autorizar la salida: ${error.message}`);
}
