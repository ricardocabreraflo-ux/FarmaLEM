"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession, type ProfileRole } from "@/lib/admin-auth";
import { createProfile, updateProfile } from "@/lib/profiles";
import { hashPassword } from "@/lib/password";
import { logAction } from "@/lib/history";

export interface EmployeeFormState {
  error?: string;
}

function readFields(formData: FormData) {
  return {
    username: String(formData.get("username") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    role: String(formData.get("role") ?? "employee") as ProfileRole,
    shift: String(formData.get("shift") ?? "Matutino"),
    dailyRate: Number(formData.get("dailyRate") ?? 0),
    active: formData.get("active") === "true",
  };
}

export async function createEmployee(_prevState: EmployeeFormState | undefined, formData: FormData): Promise<EmployeeFormState> {
  const session = await requireAdminSession();

  const fields = readFields(formData);
  const password = String(formData.get("password") ?? "");
  if (!fields.username || !fields.fullName) return { error: "Usuario y nombre son obligatorios." };
  if (!password) return { error: "La contraseña es obligatoria para un empleado nuevo." };
  if (fields.dailyRate < 0) return { error: "La tarifa diaria no puede ser negativa." };

  try {
    await createProfile(fields, hashPassword(password));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo crear el empleado." };
  }

  await logAction(session.uid, "Creó empleado", `${fields.fullName} · ${fields.shift}`);
  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

export async function updateEmployee(id: string, _prevState: EmployeeFormState | undefined, formData: FormData): Promise<EmployeeFormState> {
  const session = await requireAdminSession();

  const fields = readFields(formData);
  const password = String(formData.get("password") ?? "");
  if (!fields.username || !fields.fullName) return { error: "Usuario y nombre son obligatorios." };
  if (fields.dailyRate < 0) return { error: "La tarifa diaria no puede ser negativa." };

  try {
    await updateProfile(id, fields, password ? hashPassword(password) : null);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el empleado." };
  }

  await logAction(session.uid, "Editó empleado", `${fields.fullName} · ${fields.shift} · ${fields.active ? "Activo" : "Inactivo"}`);
  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}
