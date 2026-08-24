import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { ProfileRole } from "@/lib/admin-auth";

export interface Profile {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: ProfileRole;
  shift: string;
  daily_rate: number;
  active: boolean;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  hire_date: string | null;
  curp_rfc: string | null;
  address: string | null;
  reference_letter_path: string | null;
  sicad_exam_path: string | null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin().from("profiles").select().eq("username", username.toLowerCase()).single();
  if (error) return null;
  return data as Profile;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin().from("profiles").select().eq("id", id).single();
  if (error) return null;
  return data as Profile;
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin().from("profiles").select().order("full_name");
  if (error) throw new Error(`No se pudieron leer los empleados: ${error.message}`);
  return data as Profile[];
}

interface ProfileInput {
  username: string;
  fullName: string;
  role: ProfileRole;
  shift: string;
  dailyRate: number;
  active: boolean;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  hireDate: string | null;
  curpRfc: string | null;
  address: string | null;
}

/** Lanza un Error con mensaje claro si el usuario ya existe; cualquier otro código se relanza tal cual. */
function throwFriendly(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new Error("Ese usuario ya existe.");
  throw new Error(error.message);
}

function baseRow(input: ProfileInput) {
  return {
    username: input.username.toLowerCase(),
    full_name: input.fullName,
    role: input.role,
    shift: input.shift,
    daily_rate: input.dailyRate,
    active: input.active,
    phone: input.phone,
    emergency_contact_name: input.emergencyContactName,
    emergency_contact_phone: input.emergencyContactPhone,
    hire_date: input.hireDate,
    curp_rfc: input.curpRfc,
    address: input.address,
  };
}

export async function createProfile(input: ProfileInput, passwordHash: string): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .insert({ ...baseRow(input), password_hash: passwordHash })
    .select("id")
    .single();
  if (error) throwFriendly(error);
  return data.id as string;
}

export async function updateProfile(id: string, input: ProfileInput, passwordHash: string | null): Promise<void> {
  const patch: Record<string, unknown> = { ...baseRow(input), updated_at: new Date().toISOString() };
  if (passwordHash) patch.password_hash = passwordHash;

  const { error } = await supabaseAdmin().from("profiles").update(patch).eq("id", id);
  if (error) throwFriendly(error);
}

const DOCUMENT_BUCKET = "farmalem-documents";

export async function uploadEmployeeDocument(employeeId: string, kind: "carta" | "sicad", file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "pdf";
  const path = `empleados/${employeeId}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin()
    .storage.from(DOCUMENT_BUCKET)
    .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: true });
  if (error) throw new Error(`No se pudo subir el documento: ${error.message}`);
  return path;
}

export async function getEmployeeDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().storage.from(DOCUMENT_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

export async function saveEmployeeDocumentPath(id: string, field: "reference_letter_path" | "sicad_exam_path", path: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("profiles")
    .update({ [field]: path, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

const HISTORY_TABLES = ["cuts", "attendance", "bonus_weeks", "withdrawals", "payroll", "extra_bonuses"] as const;

/** Antes de borrar un empleado hay que asegurarse de que no tenga historial real ligado (cortes, asistencia, sueldos, etc.). */
export async function profileHasHistory(id: string): Promise<boolean> {
  const db = supabaseAdmin();
  for (const table of HISTORY_TABLES) {
    const { count, error } = await db.from(table).select("id", { count: "exact", head: true }).eq("employee_id", id);
    if (error) throw new Error(`No se pudo verificar el historial (${table}): ${error.message}`);
    if ((count ?? 0) > 0) return true;
  }
  return false;
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("profiles").delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar el empleado: ${error.message}`);
}
