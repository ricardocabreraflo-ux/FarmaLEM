import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface ShelfGroup {
  nums: number[];
  vitrina: string;
}

export interface ShelfAssignment {
  matutino: ShelfGroup;
  vespertino: ShelfGroup;
  overridden: boolean;
}

const EVEN_GROUP: ShelfGroup = { nums: [2, 4, 6, 8, 10], vitrina: "Vitrina Arriba" };
const ODD_GROUP: ShelfGroup = { nums: [1, 3, 5, 7, 9], vitrina: "Vitrina Abajo + Vitrina Toallas" };

function baseAssignment(month: number): { matutino: ShelfGroup; vespertino: ShelfGroup } {
  const isOddMonth = month % 2 === 1;
  return isOddMonth ? { matutino: EVEN_GROUP, vespertino: ODD_GROUP } : { matutino: ODD_GROUP, vespertino: EVEN_GROUP };
}

async function hasOverride(month: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("anaqueles_overrides").select("month").eq("month", month).maybeSingle();
  if (error) throw new Error(`No se pudo leer el cambio de anaqueles: ${error.message}`);
  return Boolean(data);
}

/** Responsable de anaqueles por turno para un mes ('YYYY-MM') — automático (non/par), salvo que esté invertido a mano. */
export async function getShelfAssignment(month: string): Promise<ShelfAssignment> {
  const monthNum = Number(month.split("-")[1]);
  const base = baseAssignment(monthNum);
  const overridden = await hasOverride(month);
  return overridden ? { matutino: base.vespertino, vespertino: base.matutino, overridden } : { ...base, overridden };
}

export async function setShelfOverride(month: string, setBy: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("anaqueles_overrides")
    .upsert({ month, set_by: setBy, set_at: new Date().toISOString() }, { onConflict: "month" });
  if (error) throw new Error(error.message);
}

export async function clearShelfOverride(month: string): Promise<void> {
  const { error } = await supabaseAdmin().from("anaqueles_overrides").delete().eq("month", month);
  if (error) throw new Error(error.message);
}
