"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession, type ProfileRole } from "@/lib/admin-auth";
import { createProfile, updateProfile, deleteProfile, profileHasHistory, uploadEmployeeDocument, saveEmployeeDocumentPath } from "@/lib/profiles";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getDeletePinHash } from "@/lib/security-settings";
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
    phone: String(formData.get("phone") ?? "").trim() || null,
    emergencyContactName: String(formData.get("emergencyContactName") ?? "").trim() || null,
    emergencyContactPhone: String(formData.get("emergencyContactPhone") ?? "").trim() || null,
    hireDate: String(formData.get("hireDate") ?? "").trim() || null,
    curpRfc: String(formData.get("curpRfc") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
  };
}

async function uploadDocuments(employeeId: string, formData: FormData) {
  const referenceLetter = formData.get("referenceLetter");
  if (referenceLetter instanceof File && referenceLetter.size > 0) {
    const path = await uploadEmployeeDocument(employeeId, "carta", referenceLetter);
    await saveEmployeeDocumentPath(employeeId, "reference_letter_path", path);
  }
  const sicadExam = formData.get("sicadExam");
  if (sicadExam instanceof File && sicadExam.size > 0) {
    const path = await uploadEmployeeDocument(employeeId, "sicad", sicadExam);
    await saveEmployeeDocumentPath(employeeId, "sicad_exam_path", path);
  }
}

export async function createEmployee(_prevState: EmployeeFormState | undefined, formData: FormData): Promise<EmployeeFormState> {
  const session = await requireAdminSession();

  const fields = readFields(formData);
  const password = String(formData.get("password") ?? "");
  if (!fields.username || !fields.fullName) return { error: "Usuario y nombre son obligatorios." };
  if (!password) return { error: "La contraseña es obligatoria para un empleado nuevo." };
  if (fields.dailyRate < 0) return { error: "La tarifa diaria no puede ser negativa." };

  let newId: string;
  try {
    newId = await createProfile(fields, hashPassword(password));
    await uploadDocuments(newId, formData);
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
    await uploadDocuments(id, formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el empleado." };
  }

  await logAction(session.uid, "Editó empleado", `${fields.fullName} · ${fields.shift} · ${fields.active ? "Activo" : "Inactivo"}`);
  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}

export interface DeleteEmployeeState {
  error?: string;
  ok?: boolean;
}

export async function deleteEmployeeAction(id: string, name: string, pin: string): Promise<DeleteEmployeeState> {
  const session = await requireAdminSession();

  const pinHash = await getDeletePinHash();
  if (!pinHash) return { error: "Todavía no configuras el PIN de eliminación en Configuración." };
  if (!pin || !verifyPassword(pin, pinHash)) return { error: "PIN incorrecto." };

  const hasHistory = await profileHasHistory(id);
  if (hasHistory) {
    return { error: "Esta persona ya tiene cortes, asistencia, sueldos o salidas registradas — no se puede eliminar sin perder ese historial. Desactívala en vez de eliminarla." };
  }

  try {
    await deleteProfile(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo eliminar." };
  }

  await logAction(session.uid, "Eliminó empleado", name);
  revalidatePath("/admin/empleados");
  return { ok: true };
}
