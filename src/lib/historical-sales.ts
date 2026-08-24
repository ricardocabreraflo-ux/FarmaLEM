import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface HistoricalSale {
  month: string;
  total: number;
}

/** Ventas mensuales de años/meses anteriores a que existiera el panel (capturadas a mano, una sola vez). */
export async function listHistoricalSales(): Promise<HistoricalSale[]> {
  const { data, error } = await supabaseAdmin().from("historical_sales").select();
  if (error) throw new Error(`No se pudieron leer las ventas históricas: ${error.message}`);
  return data as HistoricalSale[];
}
