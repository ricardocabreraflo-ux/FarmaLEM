import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface HistoryEntry {
  id: string;
  user_id: string | null;
  action: string;
  detail: string;
  created_at: string;
}

/** Nunca truena el flujo que la llama — si el historial falla, la acción principal ya se hizo de todas formas. */
export async function logAction(userId: string, action: string, detail: string): Promise<void> {
  const { error } = await supabaseAdmin().from("history").insert({ user_id: userId, action, detail });
  if (error) console.error("[history]", error.message);
}

export async function listHistory(limit = 200): Promise<HistoryEntry[]> {
  const { data, error } = await supabaseAdmin().from("history").select().order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`No se pudo leer el historial: ${error.message}`);
  return data as HistoryEntry[];
}
