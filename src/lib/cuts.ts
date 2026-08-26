import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type CutStatus = "Por revisar" | "Aprobado" | "Rechazado";

export interface Cut {
  id: string;
  cut_date: string;
  shift: string;
  employee_id: string;
  total: number;
  cash: number;
  card: number;
  cash_delivered: number;
  status: CutStatus;
  photo_path: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export async function listCuts(onlyEmployeeId?: string): Promise<Cut[]> {
  let query = supabaseAdmin()
    .from("cuts")
    .select()
    .order("cut_date", { ascending: false })
    .order("shift", { ascending: true })
    .order("created_at", { ascending: false });
  if (onlyEmployeeId) query = query.eq("employee_id", onlyEmployeeId);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los cortes: ${error.message}`);
  return data as Cut[];
}

export async function listCutsForMonth(month: string, onlyEmployeeId?: string): Promise<Cut[]> {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  // "Matutino" < "Vespertino" alfabéticamente, así que el orden ascendente ya deja primero el turno de la mañana.
  let query = supabaseAdmin()
    .from("cuts")
    .select()
    .gte("cut_date", start)
    .lt("cut_date", end)
    .order("cut_date", { ascending: false })
    .order("shift", { ascending: true });
  if (onlyEmployeeId) query = query.eq("employee_id", onlyEmployeeId);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los cortes: ${error.message}`);
  return data as Cut[];
}

export async function getCut(id: string): Promise<Cut | null> {
  const { data, error } = await supabaseAdmin().from("cuts").select().eq("id", id).single();
  if (error) return null;
  return data as Cut;
}

interface CreateCutInput {
  cutDate: string;
  shift: string;
  employeeId: string;
  total: number;
  cash: number;
  card: number;
  cashDelivered: number;
  createdBy: string;
  status: CutStatus;
  photoPath: string | null;
}

export async function createCut(input: CreateCutInput): Promise<void> {
  const { error } = await supabaseAdmin().from("cuts").insert({
    cut_date: input.cutDate,
    shift: input.shift,
    employee_id: input.employeeId,
    total: input.total,
    cash: input.cash,
    card: input.card,
    cash_delivered: input.cashDelivered,
    created_by: input.createdBy,
    status: input.status,
    photo_path: input.photoPath,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Ya existe un corte capturado para esa fecha y ese turno.");
    if (error.code === "23514") throw new Error("Efectivo + tarjeta debe ser igual a la venta total.");
    throw new Error(error.message);
  }
}

interface UpdateCutInput {
  cutDate: string;
  shift: string;
  employeeId: string;
  total: number;
  cash: number;
  card: number;
  cashDelivered: number;
  status: CutStatus;
}

export async function updateCut(id: string, input: UpdateCutInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("cuts")
    .update({
      cut_date: input.cutDate,
      shift: input.shift,
      employee_id: input.employeeId,
      total: input.total,
      cash: input.cash,
      card: input.card,
      cash_delivered: input.cashDelivered,
      status: input.status,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23514") throw new Error("Efectivo + tarjeta debe ser igual a la venta total.");
    throw new Error(error.message);
  }
}

export async function approveCut(id: string, approvedBy: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("cuts")
    .update({ status: "Aprobado", approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo aprobar el corte: ${error.message}`);
}

const PHOTO_BUCKET = "farmalem-documents";

export async function uploadCutPhoto(employeeId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `cortes/${employeeId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin()
    .storage.from(PHOTO_BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg" });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
  return path;
}

export async function getCutPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}
