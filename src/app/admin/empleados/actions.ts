"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession, type ProfileRole } from "@/lib/admin-auth";
import { createProfile, updateProfile } from "@/lib/profiles";
import { hashPassword } from "@/lib/password";

export interface EmployeeFormState {
  error?: string;
}

function readFields(formData: FormData) {
  return {
    username: String(formData.get("username") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    role: String(formData.get("role") ?? "employee") as ProfileRole,
    shift: String(formData.get("shift") ?? "Matutino"),
    weeklySalary: Number(formData.get("weeklySalary") ?? 0),
    shiftsPerWeek: Number(formData.get("shiftsPerWeek") ?? 7),
    active: formData.get("active") === "true",
  };
}

export async function createEmployee(_prevState: EmployeeFormState | undefined, formData: FormData): Promise<EmployeeFormState> {
  await requireAdminSession();

  const fields = readFields(formData);
  const password = String(formData.get("password") ?? "");
  if (!fields.username || !fields.fullName) return { error: "Usuario y nombre son obligatorios." };
  if (!password) return { error: "La contraseña es obligatoria para un empleado nuevo." };
  if (fields.shiftsPerWeek <= 0) return { error: "Los turnos por semana deben ser mayor a 0." };

  try {
    await createProfile(fields, hashPassword(password));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo crear el empleado." };
  }

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

export async function updateEmployee(id: string, _prevState: EmployeeFormState | undefined, formData: FormData): Promise<EmployeeFormState> {
  await requireAdminSession();

  const fields = readFields(formData);
  const password = String(formData.get("password") ?? "");
  if (!fields.username || !fields.fullName) return { error: "Usuario y nombre son obligatorios." };
  if (fields.shiftsPerWeek <= 0) return { error: "Los turnos por semana deben ser mayor a 0." };

  try {
    await updateProfile(id, fields, password ? hashPassword(password) : null);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el empleado." };
  }

  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}
