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

/** Asistencia entre dos fechas (inclusive) sin importar el mes — para el comprobante semanal. */
export async function listAttendanceForRange(startDate: string, endDate: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("attendance")
    .select()
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true });
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

export interface GenerateAttendanceResult {
  created: number;
  weekendPending: string[];
}

export type AttendancePlanOutcome = "asistencia" | "falta" | "pendiente" | "ya_capturado";

export interface AttendancePlanCell {
  date: string;
  shift: "Matutino" | "Vespertino";
  outcome: AttendancePlanOutcome;
  employeeId: string | null;
  employeeName: string | null;
  rate: number;
  existingStatus?: AttendanceStatus;
}

/**
 * Calcula qué le pondría "Generar asistencia desde los cortes" a cada
 * turno del mes, sin escribir nada — para la vista previa. Entre semana la
 * regla es mecánica: si hay corte de ese turno ese día, asistencia (con
 * quien lo haya capturado); si no lo hay, falta para quien tiene fijo ese
 * turno. Fin de semana solo hay un turno (alterna entre las dos) — si tiene
 * corte, se usa quién lo capturó; si no lo tiene, no se puede saber a quién
 * marcarle la falta sin el calendario de turnos, así que queda "pendiente".
 * Un turno que ya tiene asistencia capturada se marca "ya_capturado" y no
 * se toca.
 */
export async function planAttendanceFromCuts(month: string): Promise<AttendancePlanCell[]> {
  const db = supabaseAdmin();
  const { start, end } = monthRange(month);
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const [{ data: cuts, error: cutsErr }, { data: employees, error: empErr }, { data: existing, error: attErr }] = await Promise.all([
    db.from("cuts").select("cut_date, shift, employee_id").gte("cut_date", start).lt("cut_date", end),
    db.from("profiles").select("id, full_name, shift, daily_rate").eq("role", "employee").eq("active", true),
    db.from("attendance").select("work_date, shift, employee_id, status").gte("work_date", start).lt("work_date", end),
  ]);
  if (cutsErr) throw new Error(`No se pudieron leer los cortes: ${cutsErr.message}`);
  if (empErr) throw new Error(`No se pudieron leer los empleados: ${empErr.message}`);
  if (attErr) throw new Error(`No se pudo leer la asistencia: ${attErr.message}`);

  const nameById = new Map((employees ?? []).map((e) => [e.id, e.full_name as string]));
  const rateById = new Map((employees ?? []).map((e) => [e.id, e.daily_rate as number]));
  const cutEmployeeByKey = new Map<string, string>();
  for (const c of cuts ?? []) cutEmployeeByKey.set(`${c.cut_date}-${c.shift}`, c.employee_id);
  const existingByKey = new Map<string, { employee_id: string; status: AttendanceStatus }>();
  for (const a of existing ?? []) existingByKey.set(`${a.work_date}-${a.shift}`, { employee_id: a.employee_id, status: a.status as AttendanceStatus });

  const defaultByShift: Record<"Matutino" | "Vespertino", { id: string } | undefined> = {
    Matutino: (employees ?? []).find((e) => e.shift === "Matutino"),
    Vespertino: (employees ?? []).find((e) => e.shift === "Vespertino"),
  };

  const cells: AttendancePlanCell[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, day).getDay(); // 0 domingo … 6 sábado
    const isWeekend = dow === 0 || dow === 6;
    // Convención ya usada en CutForm: sábado cuenta como Matutino, domingo como Vespertino.
    const shiftsToday: Array<"Matutino" | "Vespertino"> = isWeekend ? [dow === 6 ? "Matutino" : "Vespertino"] : ["Matutino", "Vespertino"];

    for (const shift of shiftsToday) {
      const key = `${dateStr}-${shift}`;
      const existingRow = existingByKey.get(key);
      if (existingRow) {
        cells.push({
          date: dateStr,
          shift,
          outcome: "ya_capturado",
          employeeId: existingRow.employee_id,
          employeeName: nameById.get(existingRow.employee_id) ?? null,
          rate: 0,
          existingStatus: existingRow.status,
        });
        continue;
      }

      const cutEmployeeId = cutEmployeeByKey.get(key);
      if (cutEmployeeId) {
        cells.push({
          date: dateStr,
          shift,
          outcome: "asistencia",
          employeeId: cutEmployeeId,
          employeeName: nameById.get(cutEmployeeId) ?? null,
          rate: rateById.get(cutEmployeeId) ?? 0,
        });
      } else if (isWeekend) {
        cells.push({ date: dateStr, shift, outcome: "pendiente", employeeId: null, employeeName: null, rate: 0 });
      } else {
        const defaultEmployee = defaultByShift[shift];
        cells.push({
          date: dateStr,
          shift,
          outcome: "falta",
          employeeId: defaultEmployee?.id ?? null,
          employeeName: defaultEmployee ? (nameById.get(defaultEmployee.id) ?? null) : null,
          rate: 0,
        });
      }
    }
  }

  return cells;
}

/** Aplica el plan de planAttendanceFromCuts: escribe asistencia/falta, deja los "pendiente" en la lista y no toca los "ya_capturado". */
export async function generateAttendanceFromCuts(month: string, createdBy: string): Promise<GenerateAttendanceResult> {
  const plan = await planAttendanceFromCuts(month);
  let created = 0;
  const weekendPending: string[] = [];

  for (const cell of plan) {
    if (cell.outcome === "ya_capturado") continue;
    if (cell.outcome === "pendiente") {
      weekendPending.push(cell.date);
      continue;
    }
    if (!cell.employeeId) continue;

    await upsertAttendance({
      workDate: cell.date,
      employeeId: cell.employeeId,
      shift: cell.shift,
      status: cell.outcome === "asistencia" ? "Asistió" : "Falta",
      rate: cell.rate,
      note: cell.outcome === "falta" ? "Generado desde cortes: sin corte capturado ese turno." : null,
      createdBy,
    });
    created++;
  }

  return { created, weekendPending };
}
