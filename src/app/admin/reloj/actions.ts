"use server";

import { requireSession } from "@/lib/admin-auth";
import { findEmployeeByClockPin, registerPunch } from "@/lib/time-clock";
import { logAction } from "@/lib/history";

export interface PunchResult {
  ok: boolean;
  error?: string;
  employeeName?: string;
  type?: "Entrada" | "Salida";
  time?: string;
}

export async function punchWithPin(pin: string): Promise<PunchResult> {
  const session = await requireSession();
  if (!pin || !/^\d{4,6}$/.test(pin)) return { ok: false, error: "PIN inválido." };

  const employee = await findEmployeeByClockPin(pin);
  if (!employee) return { ok: false, error: "PIN no reconocido." };

  try {
    const { type, occurredAt } = await registerPunch(employee, session.uid);
    await logAction(session.uid, `Reloj checador · ${type}`, employee.full_name);
    return { ok: true, employeeName: employee.full_name, type, time: occurredAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo registrar el movimiento." };
  }
}
