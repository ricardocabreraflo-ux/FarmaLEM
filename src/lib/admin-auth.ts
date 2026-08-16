import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión de administrador con contraseña única compartida (no hay tabla de
 * usuarios — es un solo panel para la farmacia). La cookie es un token
 * firmado con HMAC, verificable sin guardar sesiones en la base de datos.
 *
 * Requiere en .env.local:
 *   ADMIN_PASSWORD=... (la contraseña que tú eliges para entrar al panel)
 *   ADMIN_SESSION_SECRET=... (cadena aleatoria larga, solo para firmar la cookie —
 *     genera una con: openssl rand -hex 32)
 */
export const ADMIN_COOKIE_NAME = "farmalem_admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta ADMIN_SESSION_SECRET en las variables de entorno.");
  }
  return secret;
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("Falta ADMIN_PASSWORD en las variables de entorno.");
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSessionToken() {
  const issuedAt = Date.now().toString();
  const signature = createHmac("sha256", getSecret()).update(issuedAt).digest("hex");
  return `${issuedAt}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expected = createHmac("sha256", getSecret()).update(issuedAt).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= SESSION_MAX_AGE_MS;
}
