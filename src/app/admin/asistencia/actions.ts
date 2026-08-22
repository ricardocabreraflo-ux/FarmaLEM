"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { upsertAttendance, deleteAttendance, type AttendanceStatus } from "@/lib/attendance";

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

  revalidatePath("/admin/asistencia");
  redirect(`/admin/asistencia?mes=${month}`);
}

export async function deleteAttendanceAction(id: string) {
  await requireAdminSession();
  await deleteAttendance(id);
  revalidatePath("/admin/asistencia");
}
