import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createSessionToken } from "@/lib/admin-auth";
import { getProfileByQuickLoginToken } from "@/lib/profiles";

/**
 * Enlace de "cambiar de usuario" para la computadora de la farmacia: entra
 * directo como el empleado dueño del token, sin escribir usuario ni
 * contraseña. Pensado para quedar como acceso directo por persona en un
 * equipo de confianza, no para compartirse fuera de ahí.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const profile = await getProfileByQuickLoginToken(token);

  if (!profile) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const destination = profile.role === "admin" ? "/admin" : "/admin/reloj";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(ADMIN_COOKIE_NAME, createSessionToken(profile.id, profile.role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
