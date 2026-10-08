"use server";

import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { registerPunch } from "@/lib/time-clock";
import { logAction } from "@/lib/history";

export interface PunchResult {
  ok: boolean;
  error?: string;
  employeeName?: string;
  type?: "Entrada" | "Salida";
  time?: string;
  isLate?: boolean | null;
  lateMinutes?: number | null;
  weeklyLateCount?: number | null;
}

/** Marca la Entrada/Salida de quien ya inició sesión (turno de confianza): sin volver a pedir PIN. */
export async function punchForSession(): Promise<PunchResult> {
  const session = await requireSession();
  const employee = await getProfileById(session.uid);
  if (!employee) return { ok: false, error: "No se encontró tu usuario." };

  try {
    const { type, occurredAt, isLate, lateMinutes, weeklyLateCount } = await registerPunch(employee, session.uid);
    await logAction(session.uid, `Reloj checador · ${type}`, employee.full_name);
    return { ok: true, employeeName: employee.full_name, type, time: occurredAt, isLate, lateMinutes, weeklyLateCount };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo registrar el movimiento." };
  }
}
