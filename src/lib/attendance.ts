import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type AttendanceStatus = "Asistió" | "Cubrió turno" | "Falta" | "Descanso" | "Cerrado" | "Día festivo";
const PAID_STATUSES: AttendanceStatus[] = ["Asistió", "Cubrió turno"];

export interface AttendanceRow {
  id: string;
  work_date: string;
  employee_id: string;
  shift: string;
  status: AttendanceStatus;
  rate: number;
  note: string | null;
  created_by: string;
  created_at: string;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end: nextMonth };
}

export async function listAttendanceForMonth(month: string): Promise<AttendanceRow[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabaseAdmin()
    .from("attendance")
    .select()
    .gte("work_date", start)
    .lt("work_date", end)
    .order("work_date", { ascending: false });
  if (error) throw new Error(`No se pudo leer la asistencia: ${error.message}`);
  return data as AttendanceRow[];
}

/** Suma lo que gana un empleado en el mes: solo cuentan Asistió y Cubrió turno. */
export async function salaryForEmployee(employeeId: string, month: string): Promise<number> {
  const rows = await listAttendanceForMonth(month);
  return rows
    .filter((r) => r.employee_id === employeeId && PAID_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + r.rate, 0);
}

interface UpsertAttendanceInput {
  workDate: string;
  employeeId: string;
  shift: string;
  status: AttendanceStatus;
  rate: number;
  note: string | null;
  createdBy: string;
}

export async function upsertAttendance(input: UpsertAttendanceInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("attendance")
    .upsert(
      {
        work_date: input.workDate,
        employee_id: input.employeeId,
        shift: input.shift,
        status: input.status,
        rate: input.rate,
        note: input.note,
        created_by: input.createdBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "work_date,employee_id,shift" }
    );
  if (error) throw new Error(error.message);
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("attendance").delete().eq("id", id);
  if (error) throw new Error(`No se pudo quitar el registro: ${error.message}`);
}
