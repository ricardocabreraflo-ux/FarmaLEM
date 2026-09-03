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
    // Del día 1 hacia adelante, y dentro del mismo día Matutino antes que
    // Vespertino ("Fin de semana matutino" < "Fin de semana vespertino" por
    // orden alfabético también, así que aplica igual en fin de semana).
    .order("work_date", { ascending: true })
    .order("shift", { ascending: true });
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

export type AttendancePlanOutcome = "asistencia" | "falta" | "pendiente" | "ya_capturado" | "corregir_tarifa";

export interface AttendancePlanCell {
  date: string;
  shift: "Matutino" | "Vespertino";
  outcome: AttendancePlanOutcome;
  employeeId: string | null;
  employeeName: string | null;
  rate: number;
  existingStatus?: AttendanceStatus;
  /** Turno tal cual está guardado ("Fin de semana matutino", etc.) — para corregir la misma fila en vez de crear una nueva. */
  rawShift?: string;
}

/** "Matutino", "Fin de semana matutino" → "Matutino" (y lo mismo para Vespertino) — para comparar turnos sin importar cómo se haya capturado. */
function normalizeShift(shift: string): "Matutino" | "Vespertino" | null {
  const s = shift.trim().toLowerCase();
  if (s.endsWith("matutino")) return "Matutino";
  if (s.endsWith("vespertino")) return "Vespertino";
  return null;
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
    db.from("attendance").select("work_date, shift, employee_id, status, rate").gte("work_date", start).lt("work_date", end),
  ]);
  if (cutsErr) throw new Error(`No se pudieron leer los cortes: ${cutsErr.message}`);
  if (empErr) throw new Error(`No se pudieron leer los empleados: ${empErr.message}`);
  if (attErr) throw new Error(`No se pudo leer la asistencia: ${attErr.message}`);

  const nameById = new Map((employees ?? []).map((e) => [e.id, e.full_name as string]));
  const rateById = new Map((employees ?? []).map((e) => [e.id, e.daily_rate as number]));
  const cutEmployeeByKey = new Map<string, string>();
  for (const c of cuts ?? []) cutEmployeeByKey.set(`${c.cut_date}-${c.shift}`, c.employee_id);
  // La captura manual de fin de semana usa "Fin de semana matutino/vespertino"
  // como turno, distinto de como lo guardan los cortes y el resto de la app
  // ("Matutino"/"Vespertino") — se normaliza para que ambas formas cuenten
  // como el mismo turno ya capturado.
  const existingByKey = new Map<string, { employee_id: string; status: AttendanceStatus; rate: number; rawShift: string }>();
  for (const a of existing ?? []) {
    const normalized = normalizeShift(a.shift);
    if (!normalized) continue;
    existingByKey.set(`${a.work_date}-${normalized}`, {
      employee_id: a.employee_id,
      status: a.status as AttendanceStatus,
      rate: a.rate as number,
      rawShift: a.shift,
    });
  }

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
        const isPaid = existingRow.status === "Asistió" || existingRow.status === "Cubrió turno";
        // Fin de semana ya capturado: si es un día pagado, debió quedar a
        // 2x la tarifa diaria (turno doble) — si quedó a 1x, se ofrece
        // corregirlo en vez de darlo por bueno.
        if (isWeekend && isPaid) {
          const expectedRate = (rateById.get(existingRow.employee_id) ?? 0) * 2;
          if (existingRow.rate !== expectedRate) {
            cells.push({
              date: dateStr,
              shift,
              outcome: "corregir_tarifa",
              employeeId: existingRow.employee_id,
              employeeName: nameById.get(existingRow.employee_id) ?? null,
              rate: expectedRate,
              existingStatus: existingRow.status,
              rawShift: existingRow.rawShift,
            });
            continue;
          }
        }
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
        // Fin de semana: quien cubre hace el día completo sola (la otra
        // descansa) — se paga turno doble, 2x la tarifa diaria.
        const baseRate = rateById.get(cutEmployeeId) ?? 0;
        cells.push({
          date: dateStr,
          shift,
          outcome: "asistencia",
          employeeId: cutEmployeeId,
          employeeName: nameById.get(cutEmployeeId) ?? null,
          rate: isWeekend ? baseRate * 2 : baseRate,
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

/** Aplica el plan de planAttendanceFromCuts: escribe asistencia/falta, corrige tarifas de fin de semana, deja los "pendiente" en la lista y no toca los "ya_capturado". */
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

    if (cell.outcome === "corregir_tarifa") {
      // Usa el turno tal cual estaba guardado (puede ser "Fin de semana
      // matutino") para corregir esa misma fila, no crear una nueva.
      await upsertAttendance({
        workDate: cell.date,
        employeeId: cell.employeeId,
        shift: cell.rawShift ?? cell.shift,
        status: cell.existingStatus ?? "Asistió",
        rate: cell.rate,
        note: "Corregido: turno doble de fin de semana (2x tarifa).",
        createdBy,
      });
      created++;
      continue;
    }

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

export type AttendanceCalendarOutcome = AttendanceStatus | "sin_capturar";

export interface AttendanceCalendarCell {
  date: string;
  shift: "Matutino" | "Vespertino";
  outcome: AttendanceCalendarOutcome;
  employeeName: string | null;
}

/**
 * Calendario de solo lectura con lo que ya está realmente capturado en
 * Asistencia — a diferencia de planAttendanceFromCuts, aquí no se asume
 * "Falta" cuando no hay nada capturado: un turno sin capturar se queda
 * como "sin_capturar". Pensado para meses en curso donde ya se va
 * capturando la asistencia día a día (no para migrar un mes atrasado).
 */
export async function getAttendanceCalendar(month: string): Promise<AttendanceCalendarCell[]> {
  const db = supabaseAdmin();
  const { start, end } = monthRange(month);
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const [{ data: rows, error: attErr }, { data: employees, error: empErr }] = await Promise.all([
    db.from("attendance").select("work_date, shift, employee_id, status").gte("work_date", start).lt("work_date", end),
    db.from("profiles").select("id, full_name"),
  ]);
  if (attErr) throw new Error(`No se pudo leer la asistencia: ${attErr.message}`);
  if (empErr) throw new Error(`No se pudieron leer los empleados: ${empErr.message}`);

  const nameById = new Map((employees ?? []).map((e) => [e.id, e.full_name as string]));
  const byKey = new Map<string, { employeeId: string; status: AttendanceStatus }>();
  for (const r of rows ?? []) {
    const normalized = normalizeShift(r.shift);
    if (!normalized) continue;
    byKey.set(`${r.work_date}-${normalized}`, { employeeId: r.employee_id, status: r.status as AttendanceStatus });
  }

  const cells: AttendanceCalendarCell[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const shiftsToday: Array<"Matutino" | "Vespertino"> = isWeekend ? [dow === 6 ? "Matutino" : "Vespertino"] : ["Matutino", "Vespertino"];

    for (const shift of shiftsToday) {
      const found = byKey.get(`${dateStr}-${shift}`);
      cells.push({
        date: dateStr,
        shift,
        outcome: found ? found.status : "sin_capturar",
        employeeName: found ? (nameById.get(found.employeeId) ?? null) : null,
      });
    }
  }

  return cells;
}
