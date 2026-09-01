"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  createTrustToken,
  trustCookieName,
  verifyTrustToken,
  TRUST_MAX_AGE_SECONDS,
} from "@/lib/admin-auth";
import { getActiveEmployeeByShift } from "@/lib/profiles";
import { verifyPassword } from "@/lib/password";
import { logAction } from "@/lib/history";

export interface TurnoFormState {
  error?: string;
}

async function setSessionCookie(employeeId: string, role: "admin" | "employee") {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createSessionToken(employeeId, role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Computadora ya reconocida para ese turno: solo pide el PIN corto (el mismo del reloj checador). */
export async function loginWithPin(shift: string, pin: string): Promise<TurnoFormState> {
  const store = await cookies();
  const employee = await getActiveEmployeeByShift(shift);
  if (!employee) return { error: "No hay nadie asignado a ese turno todavía." };

  const trust = verifyTrustToken(store.get(trustCookieName(shift))?.value);
  if (!trust || trust.employeeId !== employee.id) {
    return { error: "Esta computadora ya no está reconocida para este turno — entra con tu usuario y contraseña." };
  }
  if (!pin || !employee.clock_pin_hash || !verifyPassword(pin, employee.clock_pin_hash)) {
    return { error: "PIN incorrecto." };
  }

  await setSessionCookie(employee.id, employee.role);
  await logAction(employee.id, "Inició sesión (PIN rápido)", shift);
  redirect("/admin/inicio");
}

/** Primera vez en esta computadora: pide usuario/contraseña y, si es correcto, marca la computadora como reconocida para ese turno. */
export async function loginWithPassword(shift: string, password: string): Promise<TurnoFormState> {
  const employee = await getActiveEmployeeByShift(shift);
  if (!employee) return { error: "No hay nadie asignado a ese turno todavía." };
  if (!password || !verifyPassword(password, employee.password_hash)) return { error: "Contraseña incorrecta." };

  const store = await cookies();
  store.set(trustCookieName(shift), createTrustToken(employee.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRUST_MAX_AGE_SECONDS,
  });

  await setSessionCookie(employee.id, employee.role);
  await logAction(employee.id, "Inició sesión (usuario y contraseña)", shift);
  redirect("/admin/inicio");
}

/** Cierra la sesión actual y regresa al selector de turno (para cuando cambia el turno en la misma computadora). */
export async function logoutToTurno() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/turno");
}
