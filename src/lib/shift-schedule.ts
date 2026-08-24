import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface ShiftAssignment {
  id: string;
  work_date: string;
  shift: "Matutino" | "Vespertino";
  employee_id: string | null;
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
  employeeId: string | null;
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

export async function listWeekLabels(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin().from("shift_week_labels").select();
  if (error) throw new Error(`No se pudieron leer las etiquetas de semana: ${error.message}`);
  return Object.fromEntries((data as Array<{ week_start: string; label: string }>).map((r) => [r.week_start, r.label]));
}

export async function saveWeekLabel(weekStart: string, label: string): Promise<void> {
  if (!label) {
    const { error } = await supabaseAdmin().from("shift_week_labels").delete().eq("week_start", weekStart);
    if (error) throw new Error(`No se pudo quitar la etiqueta: ${error.message}`);
    return;
  }
  const { error } = await supabaseAdmin().from("shift_week_labels").upsert({ week_start: weekStart, label }, { onConflict: "week_start" });
  if (error) throw new Error(`No se pudo guardar la etiqueta: ${error.message}`);
}

export interface GenerateMonthResult {
  matutinoName: string | null;
  vespertinoName: string | null;
  soloWeekend: boolean;
  daysGenerated: number;
}

/**
 * Genera el mes siguiente siguiendo el patrón vigente: entre semana, quien
 * tenga hoy el turno Matutino/Vespertino fijo (activo); fines de semana,
 * una sola persona cubre el día completo, alternando cada semana a partir
 * de quién dobló el último fin de semana ya capturado. Si falta alguien
 * (baja sin reemplazo), esa casilla queda "Vacante" (employee_id null) en
 * vez de detener la generación. No pisa filas que ya existan (on conflict
 * do nothing), así que es seguro correrlo más de una vez.
 */
export async function generateMonthSchedule(month: string, createdBy: string): Promise<GenerateMonthResult> {
  const admin = supabaseAdmin();

  const { data: employees, error: empErr } = await admin
    .from("profiles")
    .select("id, full_name, shift")
    .eq("role", "employee")
    .eq("active", true);
  if (empErr) throw new Error(`No se pudieron leer empleados: ${empErr.message}`);

  const matutino = (employees ?? []).find((e) => e.shift === "Matutino") ?? null;
  const vespertino = (employees ?? []).find((e) => e.shift === "Vespertino") ?? null;
  const weekendPool = [matutino, vespertino].filter((e): e is { id: string; full_name: string; shift: string } => e !== null);

  const { start } = monthRange(month);
  const { data: lastDoubleRows } = await admin
    .from("shift_schedule")
    .select("work_date, employee_id")
    .lt("work_date", start)
    .eq("is_double_shift", true)
    .order("work_date", { ascending: false })
    .limit(1);
  const lastDouble = lastDoubleRows?.[0] ?? null;

  function complement(id: string): string {
    return weekendPool.find((e) => e.id !== id)?.id ?? id;
  }

  let carry: string | null = weekendPool[0]?.id ?? null;
  if (weekendPool.length === 2 && lastDouble) {
    const lastDow = new Date(`${lastDouble.work_date}T12:00:00`).getDay();
    carry = lastDow === 0 ? lastDouble.employee_id : complement(lastDouble.employee_id as string);
  }

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const rows: Array<{ work_date: string; shift: "Matutino" | "Vespertino"; employee_id: string | null; is_double_shift: boolean; created_by: string }> = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, day).getDay(); // 0 domingo ... 6 sábado

    if (dow === 0 || dow === 6) {
      if (weekendPool.length === 2) {
        const doubler = dow === 6 ? carry! : complement(carry!);
        if (dow === 0) carry = doubler;
        rows.push({ work_date: dateStr, shift: "Matutino", employee_id: doubler, is_double_shift: true, created_by: createdBy });
        rows.push({ work_date: dateStr, shift: "Vespertino", employee_id: doubler, is_double_shift: true, created_by: createdBy });
      } else if (weekendPool.length === 1) {
        const solo = weekendPool[0];
        const otherShift = solo.shift === "Matutino" ? "Vespertino" : "Matutino";
        rows.push({ work_date: dateStr, shift: solo.shift as "Matutino" | "Vespertino", employee_id: solo.id, is_double_shift: false, created_by: createdBy });
        rows.push({ work_date: dateStr, shift: otherShift, employee_id: null, is_double_shift: false, created_by: createdBy });
      } else {
        rows.push({ work_date: dateStr, shift: "Matutino", employee_id: null, is_double_shift: false, created_by: createdBy });
        rows.push({ work_date: dateStr, shift: "Vespertino", employee_id: null, is_double_shift: false, created_by: createdBy });
      }
    } else {
      rows.push({ work_date: dateStr, shift: "Matutino", employee_id: matutino?.id ?? null, is_double_shift: false, created_by: createdBy });
      rows.push({ work_date: dateStr, shift: "Vespertino", employee_id: vespertino?.id ?? null, is_double_shift: false, created_by: createdBy });
    }
  }

  const { error } = await admin.from("shift_schedule").upsert(rows, { onConflict: "work_date,shift", ignoreDuplicates: true });
  if (error) throw new Error(`No se pudo generar el calendario: ${error.message}`);

  return {
    matutinoName: matutino?.full_name ?? null,
    vespertinoName: vespertino?.full_name ?? null,
    soloWeekend: weekendPool.length === 1,
    daysGenerated: daysInMonth,
  };
}
