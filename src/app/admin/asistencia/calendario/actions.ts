"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { upsertShiftAssignment, deleteShiftAssignment } from "@/lib/shift-schedule";
import { logAction } from "@/lib/history";

export async function saveShiftAssignment(workDate: string, shift: "Matutino" | "Vespertino", employeeId: string, isDoubleShift: boolean) {
  const session = await requireAdminSession();

  if (!employeeId) {
    await deleteShiftAssignment(workDate, shift);
    await logAction(session.uid, "Quitó asignación de turno", `${workDate} · ${shift}`);
  } else {
    await upsertShiftAssignment({ workDate, shift, employeeId, isDoubleShift, createdBy: session.uid });
    await logAction(session.uid, "Asignó turno", `${workDate} · ${shift}${isDoubleShift ? " · doble" : ""}`);
  }

  revalidatePath("/admin/asistencia/calendario");
  revalidatePath("/admin/asistencia");
  revalidatePath("/admin/asistencia/nuevo");
}
