"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, checkAdminPassword, createSessionToken } from "@/lib/admin-auth";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");

  let valid: boolean;
  try {
    valid = checkAdminPassword(password);
  } catch (err) {
    console.error("[admin login]", err);
    return { error: "El panel no está configurado todavía (falta ADMIN_PASSWORD)." };
  }

  if (!valid) return { error: "Contraseña incorrecta." };

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
