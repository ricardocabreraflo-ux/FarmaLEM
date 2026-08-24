import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface ShiftAssignment {
  id: string;
  work_date: string;
  shift: "Matutino" | "Vespertino";
  employee_id: string;
  is_double_shift: boolean;
  created_by: string;
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function listShiftScheduleForMonth(month: string): Promise<ShiftAssignment[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabaseAdmin().from("shift_schedule").select().gte("work_date", start).lt("work_date", end);
  if (error) throw new Error(`No se pudo leer el calendario de turnos: ${error.message}`);
  return data as ShiftAssignment[];
}

export async function listShiftScheduleForDate(workDate: string): Promise<ShiftAssignment[]> {
  const { data, error } = await supabaseAdmin().from("shift_schedule").select().eq("work_date", workDate);
  if (error) throw new Error(`No se pudo leer el calendario de turnos: ${error.message}`);
  return data as ShiftAssignment[];
}

interface UpsertShiftAssignmentInput {
  workDate: string;
  shift: "Matutino" | "Vespertino";
  employeeId: string;
  isDoubleShift: boolean;
  createdBy: string;
}

export async function upsertShiftAssignment(input: UpsertShiftAssignmentInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("shift_schedule")
    .upsert(
      {
        work_date: input.workDate,
        shift: input.shift,
        employee_id: input.employeeId,
        is_double_shift: input.isDoubleShift,
        created_by: input.createdBy,
      },
      { onConflict: "work_date,shift" }
    );
  if (error) throw new Error(error.message);
}

export async function deleteShiftAssignment(workDate: string, shift: string): Promise<void> {
  const { error } = await supabaseAdmin().from("shift_schedule").delete().eq("work_date", workDate).eq("shift", shift);
  if (error) throw new Error(`No se pudo quitar la asignación: ${error.message}`);
}
