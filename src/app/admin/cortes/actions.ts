"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { createCut, replaceCut, getCutByShift, approveCut, updateCut, uploadCutPhoto, type CutStatus } from "@/lib/cuts";
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
  const markPending = formData.get("markPending") === "1";
  const photo = formData.get("photo");

  // Una empleada solo puede capturar su propio corte; solo administración
  // puede elegir a nombre de quién se está capturando.
  const employeeId = session.role === "admin" && requestedEmployeeId ? requestedEmployeeId : session.uid;

  if (!cutDate || !shift) return { error: "Fecha y turno son obligatorios." };
  if (session.role !== "admin" && cutDate < mexicoCityToday().slice(0, 7) + "-01") {
    return { error: "Ya no puedes capturar un corte de un mes anterior — pídele a administración que lo agregue." };
  }
  if (Math.abs(cash + card - total) >= 0.01) return { error: "Efectivo + tarjeta debe ser igual a la venta total." };

  // Ya existe un corte de esa fecha/turno/empleado (choca con el índice único cuts_one_shift).
  // Si todavía no se aprueba, se deja corregir en el momento en vez de tronar con un error
  // sin salida — es justo el caso de quien se equivocó al capturar y lo vuelve a intentar.
  const existing = await getCutByShift(cutDate, shift, employeeId);
  if (existing && existing.status === "Aprobado") {
    return { error: "Ya existe un corte aprobado para esa fecha y turno — pídele a administración que lo corrija desde Cortes." };
  }

  let photoPath: string | null = existing?.photo_path ?? null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoPath = await uploadCutPhoto(employeeId, photo);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo subir la foto." };
    }
  }

  const status: CutStatus = session.role === "admin" && !markPending ? "Aprobado" : "Por revisar";

  try {
    if (existing) {
      await replaceCut(existing.id, { total, cash, card, cashDelivered, status, photoPath });
    } else {
      await createCut({ cutDate, shift, employeeId, total, cash, card, cashDelivered, createdBy: session.uid, status, photoPath });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el corte." };
  }

  // Solo al capturar por primera vez — si es una corrección, la nómina de esa semana
  // ya se registró como salida de efectivo la vez anterior y no hay que duplicarla.
  if (nomina > 0 && !existing) {
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

  await logAction(session.uid, existing ? "Corrigió corte" : "Creó corte", `${cutDate} · ${shift} · $${total.toFixed(2)}`);

  const employeeProfile = await getProfileById(employeeId);
  await sendCutWhatsAppNotification({
    employeeName: employeeProfile?.full_name ?? "Equipo",
    shift,
    cutDate,
    total,
  });

  revalidatePath("/admin/cortes");
  redirect("/admin/cortes?guardado=1");
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
