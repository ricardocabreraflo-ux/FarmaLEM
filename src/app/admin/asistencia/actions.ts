"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { upsertAttendance, deleteAttendance, type AttendanceStatus } from "@/lib/attendance";
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
  const month = String(formData.get("month") ?? workDate.slice(0, 7));

  if (!workDate || !employeeId || !shift || !status) return { error: "Completa fecha, empleado, turno y estado." };

  try {
    await upsertAttendance({ workDate, employeeId, shift, status, rate, note: note || null, createdBy: session.uid });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar la asistencia." };
  }

  await logAction(session.uid, "Registró asistencia", `${workDate} · ${shift} · ${status}`);
  revalidatePath("/admin/asistencia");
  redirect(`/admin/asistencia?mes=${month}`);
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
