"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { createCut, approveCut, updateCut, uploadCutPhoto, type CutStatus } from "@/lib/cuts";
import { createWithdrawal } from "@/lib/withdrawals";
import { getProfileById } from "@/lib/profiles";
import { logAction } from "@/lib/history";
import { sendCutWhatsAppNotification } from "@/lib/whatsapp";

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
  const nomina = Number(formData.get("nomina") ?? 0);
  const photo = formData.get("photo");

  // Una empleada solo puede capturar su propio corte; solo administración
  // puede elegir a nombre de quién se está capturando.
  const employeeId = session.role === "admin" && requestedEmployeeId ? requestedEmployeeId : session.uid;

  if (!cutDate || !shift) return { error: "Fecha y turno son obligatorios." };
  if (session.role !== "admin" && cutDate < new Date().toISOString().slice(0, 7) + "-01") {
    return { error: "Ya no puedes capturar un corte de un mes anterior — pídele a administración que lo agregue." };
  }
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

  if (nomina > 0) {
    await createWithdrawal({
      withdrawalDate: cutDate,
      shift,
      type: "Nómina",
      amount: nomina,
      concept: "Pago de nómina desde corte",
      invoice: null,
      recipient: null,
      supplierId: null,
      employeeId,
      createdBy: session.uid,
      authorizedBy: session.role === "admin" ? session.uid : null,
    });
  }

  await logAction(session.uid, "Creó corte", `${cutDate} · ${shift} · $${total.toFixed(2)}`);

  const employeeProfile = await getProfileById(employeeId);
  await sendCutWhatsAppNotification({
    employeeName: employeeProfile?.full_name ?? "Equipo",
    shift,
    cutDate,
    total,
  });

  revalidatePath("/admin/cortes");
  redirect("/admin/cortes");
}

export async function updateCutForm(_prevState: CutFormState | undefined, formData: FormData): Promise<CutFormState> {
  const session = await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const cutDate = String(formData.get("cutDate") ?? "");
  const shift = String(formData.get("shift") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const total = Number(formData.get("total") ?? 0);
  const card = Number(formData.get("card") ?? 0);
  const cash = Math.max(total - card, 0);
  const cashDelivered = Number(formData.get("cashDelivered") ?? 0);
  const status = String(formData.get("status") ?? "Aprobado") as CutStatus;

  if (!id || !cutDate || !shift || !employeeId) return { error: "Fecha, turno y empleado son obligatorios." };

  try {
    await updateCut(id, { cutDate, shift, employeeId, total, cash, card, cashDelivered, status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo actualizar el corte." };
  }

  await logAction(session.uid, "Editó corte", `${cutDate} · ${shift} · $${total.toFixed(2)}`);

  revalidatePath("/admin/cortes");
  redirect("/admin/cortes");
}

export async function approveCutAction(id: string) {
  const session = await requireAdminSession();
  await approveCut(id, session.uid);
  await logAction(session.uid, "Aprobó corte", `#${id.slice(0, 8).toUpperCase()}`);
  revalidatePath("/admin/cortes");
}
