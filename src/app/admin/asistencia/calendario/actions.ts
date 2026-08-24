"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { upsertShiftAssignment, saveWeekLabel as saveWeekLabelDb, generateMonthSchedule } from "@/lib/shift-schedule";
import { logAction } from "@/lib/history";

export async function saveShiftAssignment(workDate: string, shift: "Matutino" | "Vespertino", employeeId: string, isDoubleShift: boolean) {
  const session = await requireAdminSession();

  await upsertShiftAssignment({ workDate, shift, employeeId: employeeId || null, isDoubleShift, createdBy: session.uid });
  await logAction(
    session.uid,
    employeeId ? "Asignó turno" : "Marcó turno vacante",
    `${workDate} · ${shift}${isDoubleShift ? " · doble" : ""}`
  );

  revalidatePath("/admin/asistencia/calendario");
  revalidatePath("/admin/asistencia");
  revalidatePath("/admin/asistencia/nuevo");
}

export async function saveWeekLabel(weekStart: string, label: string) {
  await requireAdminSession();
  await saveWeekLabelDb(weekStart, label);
  revalidatePath("/admin/asistencia/calendario");
}

export async function generateNextMonth(month: string) {
  const session = await requireAdminSession();
  const result = await generateMonthSchedule(month, session.uid);
  await logAction(session.uid, "Generó calendario de turnos", month);
  revalidatePath("/admin/asistencia/calendario");
  revalidatePath("/admin/asistencia");
  revalidatePath("/admin/asistencia/nuevo");
  return result;
}
