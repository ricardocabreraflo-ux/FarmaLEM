"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { createCut, approveCut, uploadCutPhoto } from "@/lib/cuts";
import { logAction } from "@/lib/history";

export interface CutFormState {
  error?: string;
}

export async function createCutForm(_prevState: CutFormState | undefined, formData: FormData): Promise<CutFormState> {
  const session = await requireSession();

  const cutDate = String(formData.get("cutDate") ?? "");
  const shift = String(formData.get("shift") ?? "");
  const requestedEmployeeId = String(formData.get("employeeId") ?? "");
  const total = Number(formData.get("total") ?? 0);
  const cash = Number(formData.get("cash") ?? 0);
  const card = Number(formData.get("card") ?? 0);
  const cashDelivered = Number(formData.get("cashDelivered") ?? 0);
  const photo = formData.get("photo");

  // Una empleada solo puede capturar su propio corte; solo administración
  // puede elegir a nombre de quién se está capturando.
  const employeeId = session.role === "admin" && requestedEmployeeId ? requestedEmployeeId : session.uid;

  if (!cutDate || !shift) return { error: "Fecha y turno son obligatorios." };
  if (Math.abs(cash + card - total) >= 0.01) return { error: "Efectivo + tarjeta debe ser igual a la venta total." };

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoPath = await uploadCutPhoto(employeeId, photo);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la foto." };
    }
  }

  try {
    await createCut({
      cutDate,
      shift,
      employeeId,
      total,
      cash,
      card,
      cashDelivered,
      createdBy: session.uid,
      status: session.role === "admin" ? "Aprobado" : "Por revisar",
      photoPath,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el corte." };
  }

  await logAction(session.uid, "Creó corte", `${cutDate} · ${shift} · $${total.toFixed(2)}`);
  revalidatePath("/admin/cortes");
  redirect("/admin/cortes");
}

export async function approveCutAction(id: string) {
  const session = await requireAdminSession();
  await approveCut(id, session.uid);
  await logAction(session.uid, "Aprobó corte", `#${id.slice(0, 8).toUpperCase()}`);
  revalidatePath("/admin/cortes");
}
