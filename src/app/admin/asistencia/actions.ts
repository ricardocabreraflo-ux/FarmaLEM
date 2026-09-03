"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  upsertAttendance,
  deleteAttendance,
  generateAttendanceFromCuts,
  planAttendanceFromCuts,
  getAttendanceCalendar,
  type AttendanceStatus,
  type GenerateAttendanceResult,
  type AttendancePlanCell,
  type AttendanceCalendarCell,
} from "@/lib/attendance";
import { logAction } from "@/lib/history";

export interface AttendanceFormState {
  error?: string;
}

export async function upsertAttendanceForm(_prevState: AttendanceFormState | undefined, formData: FormData): Promise<AttendanceFormState> {
  const session = await requireAdminSession();

  const workDate = String(formData.get("workDate") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const shift = String(formData.get("shift") ?? "");
  const status = String(formData.get("status") ?? "") as AttendanceStatus;
  const rate = Number(formData.get("rate") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!workDate || !employeeId || !shift || !status) return { error: "Completa fecha, empleado, turno y estado." };

  try {
    await upsertAttendance({ workDate, employeeId, shift, status, rate, note: note || null, createdBy: session.uid });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar la asistencia." };
  }

  await logAction(session.uid, "Registró asistencia", `${workDate} · ${shift} · ${status}`);
  revalidatePath("/admin/asistencia");
  // Manda al mes de la fecha que se acaba de capturar, no al mes que estaba abierto antes de entrar aquí
  // (si no, un registro de un mes distinto al que traía la URL "desaparecía" al guardar).
  redirect(`/admin/asistencia?mes=${workDate.slice(0, 7)}`);
}

/** Confirma un turno ya asignado en el calendario, sin tener que volver a capturar empleado/turno a mano. */
export async function confirmScheduledAttendance(workDate: string, employeeId: string, shift: string, status: AttendanceStatus, rate: number) {
  const session = await requireAdminSession();
  await upsertAttendance({ workDate, employeeId, shift, status, rate, note: null, createdBy: session.uid });
  await logAction(session.uid, "Confirmó turno programado", `${workDate} · ${shift} · ${status}`);
  revalidatePath("/admin/asistencia");
  revalidatePath("/admin/asistencia/nuevo");
}

export async function deleteAttendanceAction(id: string) {
  const session = await requireAdminSession();
  await deleteAttendance(id);
  await logAction(session.uid, "Quitó asistencia", `#${id.slice(0, 8).toUpperCase()}`);
  revalidatePath("/admin/asistencia");
}

export interface PlanAttendanceActionResult {
  ok: boolean;
  cells?: AttendancePlanCell[];
  error?: string;
}

/** Vista previa de "Generar asistencia desde los cortes" — no escribe nada. */
export async function planAttendanceFromCutsAction(month: string): Promise<PlanAttendanceActionResult> {
  await requireAdminSession();
  try {
    const cells = await planAttendanceFromCuts(month);
    return { ok: true, cells };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo calcular la vista previa." };
  }
}

export interface AttendanceCalendarActionResult {
  ok: boolean;
  cells?: AttendanceCalendarCell[];
  error?: string;
}

/** Calendario de solo lectura con lo que ya está capturado — no escribe nada, no asume faltas. */
export async function getAttendanceCalendarAction(month: string): Promise<AttendanceCalendarActionResult> {
  await requireAdminSession();
  try {
    const cells = await getAttendanceCalendar(month);
    return { ok: true, cells };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo calcular el calendario." };
  }
}

export interface GenerateAttendanceActionResult {
  ok: boolean;
  result?: GenerateAttendanceResult;
  error?: string;
}

/** Rellena la asistencia del mes a partir de los cortes ya capturados — para migrar un mes atrasado. */
export async function generateAttendanceFromCutsAction(month: string): Promise<GenerateAttendanceActionResult> {
  const session = await requireAdminSession();
  try {
    const result = await generateAttendanceFromCuts(month, session.uid);
    await logAction(session.uid, "Generó asistencia desde cortes", `${month} · ${result.created} registros`);
    revalidatePath("/admin/asistencia");
    revalidatePath("/admin/sueldos");
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo generar la asistencia." };
  }
}
