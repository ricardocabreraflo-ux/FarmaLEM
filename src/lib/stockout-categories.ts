import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface StockoutCategory {
  id: string;
  name: string;
  sort_order: number;
}

/** Si la tabla todavía no existe porque no se ha aplicado la migración, no rompe la pantalla — simplemente no hay categorías que mostrar todavía. */
export async function listStockoutCategories(): Promise<StockoutCategory[]> {
  try {
    const { data, error } = await supabaseAdmin().from("stockout_categories").select("id, name, sort_order").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    return [];
  }
}

function nextSortOrder(categories: StockoutCategory[]): number {
  return categories.reduce((max, c) => Math.max(max, c.sort_order), 0) + 10;
}

export async function createStockoutCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Ponle un nombre a la categoría.");
  const categories = await listStockoutCategories();
  if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) throw new Error("Ya existe una categoría con ese nombre.");
  const { error } = await supabaseAdmin().from("stockout_categories").insert({ name: trimmed, sort_order: nextSortOrder(categories) });
  if (error) throw new Error(error.message);
}

export async function renameStockoutCategory(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Ponle un nombre a la categoría.");
  const { error } = await supabaseAdmin().from("stockout_categories").update({ name: trimmed }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStockoutCategory(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("stockout_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
