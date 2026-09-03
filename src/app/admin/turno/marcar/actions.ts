"use server";

import { cookies } from "next/headers";
import { trustCookieName, verifyTrustToken } from "@/lib/admin-auth";
import { getActiveEmployeeByShift } from "@/lib/profiles";
import { verifyPassword } from "@/lib/password";
import { registerPunch } from "@/lib/time-clock";
import { logAction } from "@/lib/history";

export interface MarcarResult {
  ok: boolean;
  error?: string;
  employeeName?: string;
  type?: "Entrada" | "Salida";
  time?: string;
}

/**
 * Marca la Entrada/Salida de un turno sin abrir sesión completa — para el caso
 * en que la entrante llega minutos antes pero la saliente sigue con su sesión
 * abierta capturando el corte. Solo pide el mismo PIN corto del reloj
 * checador, en una computadora ya reconocida para ese turno.
 */
export async function marcarPunch(shift: string, pin: string): Promise<MarcarResult> {
  const store = await cookies();
  const employee = await getActiveEmployeeByShift(shift);
  if (!employee) return { ok: false, error: "No hay nadie asignado a ese turno todavía." };

  const trust = verifyTrustToken(store.get(trustCookieName(shift))?.value);
  if (!trust || trust.employeeId !== employee.id) {
    return { ok: false, error: "Esta computadora no está reconocida para este turno — entra normal desde el selector de turno." };
  }
  if (!pin || !employee.clock_pin_hash || !verifyPassword(pin, employee.clock_pin_hash)) {
    return { ok: false, error: "PIN incorrecto." };
  }

  try {
    const { type, occurredAt } = await registerPunch(employee, employee.id);
    await logAction(employee.id, `Marcó ${type} (pantalla independiente)`, shift);
    return { ok: true, employeeName: employee.full_name, type, time: occurredAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo registrar el movimiento." };
  }
}
