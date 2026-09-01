"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, createSessionToken } from "@/lib/admin-auth";
import { getProfileByUsername } from "@/lib/profiles";
import { verifyPassword } from "@/lib/password";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let profile;
  try {
    profile = await getProfileByUsername(username);
  } catch (err) {
    console.error("[admin login]", err);
    return { error: "El panel no está configurado todavía." };
  }

  if (!profile || !profile.active || !verifyPassword(password, profile.password_hash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createSessionToken(profile.id, profile.role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Administración entra directo a Pedidos; el equipo entra directo a su Inicio.
  redirect(profile.role === "admin" ? "/admin" : "/admin/inicio");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
