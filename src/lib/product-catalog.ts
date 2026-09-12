import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface ProductCatalogEntry {
  barcode: string;
  description: string;
  department: string | null;
  category: string | null;
  unit: string | null;
  sale_price: number | null;
  sale_price_net: number | null;
  updated_at: string;
}

export async function listProductCatalog(): Promise<ProductCatalogEntry[]> {
  const { data, error } = await supabaseAdmin().from("product_catalog").select().order("description", { ascending: true });
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  return data as ProductCatalogEntry[];
}

export async function getCatalogInfo(): Promise<{ count: number; updatedAt: string | null }> {
  const { count, error } = await supabaseAdmin().from("product_catalog").select("barcode", { count: "exact", head: true });
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  const { data: latest } = await supabaseAdmin().from("product_catalog").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return { count: count ?? 0, updatedAt: latest?.updated_at ?? null };
}
