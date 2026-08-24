import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_MARGIN_PCT = 0.35;

/** El % de margen de contribución que se usa para el punto de equilibrio. Un solo valor global, ajustable en Configuración. */
export async function getBreakevenMargin(): Promise<number> {
  const { data, error } = await supabaseAdmin().from("breakeven_settings").select("margin_percent").eq("id", SETTINGS_ID).single();
  if (error || !data) return DEFAULT_MARGIN_PCT;
  return Number(data.margin_percent);
}

export async function saveBreakevenMargin(marginPercent: number, actorId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("breakeven_settings")
    .upsert({ id: SETTINGS_ID, margin_percent: marginPercent, updated_by: actorId, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
