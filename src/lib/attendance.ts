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

/**
 * Rellena la asistencia de un mes a partir de los cortes ya capturados, para
 * cuando se migra un mes completo (cortes) sin haber ido marcando asistencia
 * día a día. Entre semana la regla es mecánica: si hay corte de ese turno
 * ese día, Asistió (con quien lo haya capturado); si no lo hay, Falta para
 * quien tiene fijo ese turno. Fin de semana solo hay un turno (alterna entre
 * las dos) — si tiene corte, se usa quién lo capturó; si no lo tiene, no se
 * puede saber a quién marcarle la falta sin el calendario de turnos, así que
 * esa fecha se deja pendiente en vez de adivinar.
 */
export async function generateAttendanceFromCuts(month: string, createdBy: string): Promise<GenerateAttendanceResult> {
  const db = supabaseAdmin();
  const { start, end } = monthRange(month);
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const [{ data: cuts, error: cutsErr }, { data: employees, error: empErr }] = await Promise.all([
    db.from("cuts").select("cut_date, shift, employee_id").gte("cut_date", start).lt("cut_date", end),
    db.from("profiles").select("id, shift, daily_rate").eq("role", "employee").eq("active", true),
  ]);
  if (cutsErr) throw new Error(`No se pudieron leer los cortes: ${cutsErr.message}`);
  if (empErr) throw new Error(`No se pudieron leer los empleados: ${empErr.message}`);

  const cutEmployeeByKey = new Map<string, string>();
  for (const c of cuts ?? []) cutEmployeeByKey.set(`${c.cut_date}-${c.shift}`, c.employee_id);

  const rateById = new Map((employees ?? []).map((e) => [e.id, e.daily_rate as number]));
  const defaultByShift: Record<"Matutino" | "Vespertino", { id: string } | undefined> = {
    Matutino: (employees ?? []).find((e) => e.shift === "Matutino"),
    Vespertino: (employees ?? []).find((e) => e.shift === "Vespertino"),
  };

  let created = 0;
  const weekendPending: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, day).getDay(); // 0 domingo … 6 sábado
    const isWeekend = dow === 0 || dow === 6;
    // Convención ya usada en CutForm: sábado cuenta como Matutino, domingo como Vespertino.
    const shiftsToday: Array<"Matutino" | "Vespertino"> = isWeekend ? [dow === 6 ? "Matutino" : "Vespertino"] : ["Matutino", "Vespertino"];

    for (const shift of shiftsToday) {
      const cutEmployeeId = cutEmployeeByKey.get(`${dateStr}-${shift}`);
      if (cutEmployeeId) {
        await upsertAttendance({
          workDate: dateStr,
          employeeId: cutEmployeeId,
          shift,
          status: "Asistió",
          rate: rateById.get(cutEmployeeId) ?? 0,
          note: null,
          createdBy,
        });
        created++;
      } else if (isWeekend) {
        weekendPending.push(dateStr);
      } else {
        const defaultEmployee = defaultByShift[shift];
        if (defaultEmployee) {
          await upsertAttendance({
            workDate: dateStr,
            employeeId: defaultEmployee.id,
            shift,
            status: "Falta",
            rate: 0,
            note: "Generado desde cortes: sin corte capturado ese turno.",
            createdBy,
          });
          created++;
        }
      }
    }
  }

  return { created, weekendPending };
}
