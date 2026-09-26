import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isCutDateLocked } from "@/lib/cuts-lock";

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
  notes: string | null;
  cash_collected: boolean;
  /** Conteo de billetes/monedas de "Contar efectivo" — llaves "billete-1000", "moneda-0.5", etc.; null si se escribió el total directo. */
  cash_breakdown: Record<string, number> | null;
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
  // La fecha va ascendente (día 1 arriba, bajando hacia fin de mes) para leerse igual que el resumen en papel.
  let query = supabaseAdmin()
    .from("cuts")
    .select()
    .gte("cut_date", start)
    .lt("cut_date", end)
    .order("cut_date", { ascending: true })
    .order("shift", { ascending: true });
  if (onlyEmployeeId) query = query.eq("employee_id", onlyEmployeeId);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los cortes: ${error.message}`);
  return data as Cut[];
}

/** Cortes en un rango de fechas explícito (p.ej. una semana que cruza de mes) — a diferencia de listCutsForMonth. */
export async function listCutsForRange(startDate: string, endDate: string, onlyEmployeeId?: string): Promise<Cut[]> {
  let query = supabaseAdmin().from("cuts").select().gte("cut_date", startDate).lte("cut_date", endDate).order("cut_date", { ascending: true });
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

/** Para saber si ya existe un corte de esa fecha/turno/empleado antes de intentar insertar otro (violaría cuts_one_shift). */
export async function getCutByShift(cutDate: string, shift: string, employeeId: string): Promise<Cut | null> {
  const { data, error } = await supabaseAdmin().from("cuts").select().eq("cut_date", cutDate).eq("shift", shift).eq("employee_id", employeeId).maybeSingle();
  if (error) return null;
  return data as Cut | null;
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
  cashBreakdown: Record<string, number> | null;
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
    cash_breakdown: input.cashBreakdown,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Ya existe un corte capturado para esa fecha y ese turno.");
    if (error.code === "23514") throw new Error("Efectivo + tarjeta debe ser igual a la venta total.");
    throw new Error(error.message);
  }
}

interface ReplaceCutInput {
  total: number;
  cash: number;
  card: number;
  cashDelivered: number;
  status: CutStatus;
  photoPath: string | null;
  cashBreakdown: Record<string, number> | null;
}

/**
 * Sobrescribe un corte que ella misma capturó mal y aún no se aprueba —
 * antes esto tronaba con "Ya existe un corte capturado" sin dar forma de
 * corregirlo sin pedirle a un admin que entrara a editarlo a mano.
 */
export async function replaceCut(id: string, input: ReplaceCutInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("cuts")
    .update({
      total: input.total,
      cash: input.cash,
      card: input.card,
      cash_delivered: input.cashDelivered,
      status: input.status,
      photo_path: input.photoPath,
      cash_breakdown: input.cashBreakdown,
    })
    .eq("id", id);
  if (error) {
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
  const existing = await getCut(id);
  if (existing && isCutDateLocked(existing.cut_date)) {
    throw new Error("Ese corte es de junio 2026 o antes — ese periodo ya quedó cerrado y no se puede modificar.");
  }
  if (isCutDateLocked(input.cutDate)) {
    throw new Error("No puedes mover un corte a junio 2026 o antes — ese periodo ya quedó cerrado.");
  }

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

/** Nota/observación libre de un corte (aclaraciones al revisar) — independiente de las cifras y el estado. */
export async function updateCutNotes(id: string, notes: string | null): Promise<void> {
  const { error } = await supabaseAdmin().from("cuts").update({ notes }).eq("id", id);
  if (error) throw new Error(`No se pudo guardar la nota: ${error.message}`);
}

/** Marca/desmarca que el efectivo físico de ese corte ya se recogió — para llevar el flujo de efectivo real, aparte del estado Aprobado. */
export async function setCutCashCollected(id: string, value: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("cuts").update({ cash_collected: value }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar la marca de efectivo recogido: ${error.message}`);
}

/** Igual que setCutCashCollected pero para varios cortes de un jalón (seleccionar y marcar todos). */
export async function bulkSetCutCashCollected(ids: string[], value: boolean): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabaseAdmin().from("cuts").update({ cash_collected: value }).in("id", ids);
  if (error) throw new Error(`No se pudo actualizar la marca de efectivo recogido: ${error.message}`);
}

/**
 * Cuánto efectivo debería seguir físicamente en la caja ahorita mismo: la
 * suma de "Efectivo entregado" de todos los cortes ya Aprobados que todavía
 * no se marcan como Recogido — sin importar de qué mes son, porque el
 * efectivo sin recoger de hace semanas sigue pendiente igual.
 */
export async function getPendingCashCollection(): Promise<{ total: number; count: number }> {
  const { data, error } = await supabaseAdmin().from("cuts").select("cash_delivered").eq("status", "Aprobado").eq("cash_collected", false);
  if (error) throw new Error(`No se pudo calcular el efectivo pendiente: ${error.message}`);
  const rows = (data ?? []) as { cash_delivered: number }[];
  return { total: rows.reduce((s, r) => s + r.cash_delivered, 0), count: rows.length };
}

/**
 * Cortes ya Aprobados que todavía no se marcan "Recogido" — el detalle
 * detrás de getPendingCashCollection, para el reporte de entrega de efectivo
 * de quien los revisó. `approvedBy` filtra a solo los que esa persona aprobó
 * (para que cada quien reporte lo que ella misma recibió y va a entregar).
 */
export async function listCutsPendingCollection(approvedBy?: string): Promise<Cut[]> {
  let query = supabaseAdmin()
    .from("cuts")
    .select()
    .eq("status", "Aprobado")
    .eq("cash_collected", false)
    .order("cut_date", { ascending: true })
    .order("shift", { ascending: true });
  if (approvedBy) query = query.eq("approved_by", approvedBy);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los cortes pendientes de entrega: ${error.message}`);
  return data as Cut[];
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
