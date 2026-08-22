import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Sesión firmada del panel de operaciones. A diferencia del password único
 * anterior, ahora guarda quién inició sesión (uid + rol), así cada sección
 * puede decidir qué mostrarle a administración vs. a una empleada.
 *
 * Requiere en .env.local:
 *   ADMIN_SESSION_SECRET=... (cadena aleatoria larga, solo para firmar la cookie —
 *     genera una con: openssl rand -hex 32)
 */
export const ADMIN_COOKIE_NAME = "farmalem_admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export type ProfileRole = "admin" | "employee";

export interface Session {
  uid: string;
  role: ProfileRole;
  exp: number;
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta ADMIN_SESSION_SECRET en las variables de entorno.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(uid: string, role: ProfileRole): string {
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const encoded = Buffer.from(JSON.stringify({ uid, role, exp })).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Session;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (payload.role !== "admin" && payload.role !== "employee") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Para usar al inicio de cualquier página server-side del panel: redirige a login si no hay sesión válida. */
export async function requireSession(): Promise<Session> {
  const store = await cookies();
  const session = verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) redirect("/admin/login");
  return session;
}

/** Igual que requireSession, pero además exige rol de administración. */
export async function requireAdminSession(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/admin");
  return session;
}
