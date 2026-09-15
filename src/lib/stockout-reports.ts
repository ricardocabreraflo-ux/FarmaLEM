import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { findLatestPurchaseByBarcode } from "@/lib/purchases";
import { getCatalogEntryByBarcode } from "@/lib/product-catalog";

export type StockoutShift = "Matutino" | "Vespertino";
export type StockoutKind = "Faltante" | "Negado";

export interface StockoutReport {
  id: string;
  report_date: string;
  shift: StockoutShift;
  kind: StockoutKind;
  barcode: string | null;
  active_substance: string;
  category: string | null;
  presentation: string | null;
  gramaje: string | null;
  quantity: number;
  sale_price: number | null;
  cost: number | null;
  notes: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_by: string;
  created_at: string;
}

export async function listStockoutReports(): Promise<StockoutReport[]> {
  const { data, error } = await supabaseAdmin()
    .from("stockout_reports")
    .select()
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los negados y faltantes: ${error.message}`);
  return data as StockoutReport[];
}

export interface CreateStockoutReportInput {
  reportDate: string;
  shift: StockoutShift;
  kind: StockoutKind;
  barcode: string | null;
  activeSubstance: string;
  category: string | null;
  presentation: string | null;
  gramaje: string | null;
  quantity: number;
  salePrice: number | null;
  cost: number | null;
  notes: string | null;
}

export async function createStockoutReport(input: CreateStockoutReportInput, createdBy: string): Promise<void> {
  const { error } = await supabaseAdmin().from("stockout_reports").insert({
    report_date: input.reportDate,
    shift: input.shift,
    kind: input.kind,
    barcode: input.barcode,
    active_substance: input.activeSubstance,
    category: input.category,
    presentation: input.presentation,
    gramaje: input.gramaje,
    quantity: input.quantity,
    sale_price: input.salePrice,
    cost: input.cost,
    notes: input.notes,
    created_by: createdBy,
  });
  if (error) throw new Error(`No se pudo guardar el registro: ${error.message}`);
}

export async function setStockoutResolved(id: string, value: boolean): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("stockout_reports")
    .update({ resolved: value, resolved_at: value ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
}

export async function deleteStockoutReport(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("stockout_reports").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar el registro: ${error.message}`);
}

/**
 * Cuando llega un renglón con ese código de barras en una recepción, marca
 * como "resuelto" cualquier negado/faltante pendiente con el mismo código
 * — solo por código exacto, nunca por descripción parecida (mismo criterio
 * que ya se usa para no cruzar renglones de compra por coincidencia
 * aproximada). Un "Negado" sin código de barras nunca se resuelve solo.
 */
export async function autoResolveStockoutsByBarcode(barcode: string): Promise<void> {
  const clean = barcode.trim();
  if (!clean) return;
  const { error } = await supabaseAdmin()
    .from("stockout_reports")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("barcode", clean)
    .eq("resolved", false);
  if (error) throw new Error(`No se pudo marcar como surtido: ${error.message}`);
}

export interface StockoutLookupResult {
  description: string;
  salePrice: number | null;
  cost: number | null;
  category: string | null;
}

/**
 * Busca ese código de barras en lo que ya se ha recibido/vendido (para el
 * costo real más reciente) y en el catálogo de referencia de SICAR X (para
 * la descripción/categoría/precio si nunca se ha comprado) — para
 * autocompletar un "Faltante" (producto que ya conocemos, solo se acabó).
 */
export async function lookupStockoutProduct(barcode: string): Promise<StockoutLookupResult | null> {
  const clean = barcode.trim();
  if (!clean) return null;

  const purchase = await findLatestPurchaseByBarcode(clean);
  const catalogEntry = await getCatalogEntryByBarcode(clean);

  if (!purchase && !catalogEntry) return null;
  return {
    description: purchase?.description ?? catalogEntry?.description ?? "",
    salePrice: purchase?.price ?? catalogEntry?.sale_price_net ?? catalogEntry?.sale_price ?? null,
    cost: purchase?.cost ?? null,
    category: catalogEntry?.category ?? null,
  };
}
