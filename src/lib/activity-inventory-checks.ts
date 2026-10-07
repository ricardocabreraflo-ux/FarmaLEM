import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type InventoryCheckShift = "Matutino" | "Vespertino";

function checkKey(date: string, shift: InventoryCheckShift): string {
  return `${date}|${shift}`;
}

/** Qué inventarios del día (matutino/vespertino) ya se marcaron como mandados ese mes — set de "YYYY-MM-DD|Turno". */
export async function listInventoryChecksForMonth(month: string): Promise<Set<string>> {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabaseAdmin().from("activity_inventory_checks").select("check_date, shift").gte("check_date", start).lt("check_date", end);
  if (error) throw new Error(`No se pudieron leer los inventarios marcados: ${error.message}`);
  return new Set((data ?? []).map((r) => checkKey(r.check_date as string, r.shift as InventoryCheckShift)));
}

export async function setInventoryCheck(date: string, shift: InventoryCheckShift, value: boolean, checkedBy: string): Promise<void> {
  const db = supabaseAdmin();
  if (value) {
    const { error } = await db.from("activity_inventory_checks").upsert({ check_date: date, shift, checked_by: checkedBy }, { onConflict: "check_date,shift" });
    if (error) throw new Error(`No se pudo marcar: ${error.message}`);
  } else {
    const { error } = await db.from("activity_inventory_checks").delete().eq("check_date", date).eq("shift", shift);
    if (error) throw new Error(`No se pudo desmarcar: ${error.message}`);
  }
}
