import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface PayrollRecord {
  employee_id: string;
  month: string;
  status: "Pendiente" | "Pagado";
}

export async function listPayrollStatus(month: string): Promise<PayrollRecord[]> {
  const { data, error } = await supabaseAdmin().from("payroll").select("employee_id, month, status").eq("month", month);
  if (error) throw new Error(`No se pudo leer el estado de nómina: ${error.message}`);
  return data as PayrollRecord[];
}

export async function togglePayrollPaid(employeeId: string, month: string, currentlyPaid: boolean, actorId: string): Promise<void> {
  const nextStatus = currentlyPaid ? "Pendiente" : "Pagado";
  const { error } = await supabaseAdmin()
    .from("payroll")
    .upsert(
      { employee_id: employeeId, month, status: nextStatus, paid_by: actorId, paid_at: nextStatus === "Pagado" ? new Date().toISOString() : null },
      { onConflict: "employee_id,month" }
    );
  if (error) throw new Error(error.message);
}
