import "server-only";
import * as XLSX from "xlsx";
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

export interface ParsedCatalogRow {
  barcode: string;
  description: string;
  department: string | null;
  category: string | null;
  unit: string | null;
  salePrice: number | null;
  salePriceNet: number | null;
}

const HEADER_ALIASES: Record<string, keyof ParsedCatalogRow | "skip"> = {
  clave: "barcode",
  "código de barras": "barcode",
  "codigo de barras": "barcode",
  descripción: "description",
  descripcion: "description",
  departamento: "department",
  categoría: "category",
  categoria: "category",
  unidad: "unit",
  precio: "salePrice",
  "precio neto": "salePriceNet",
};

function normalizeHeader(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Lee el archivo "Productos Exportados" de SICAR X — trae unas filas de
 * título/fecha antes del encabezado real, así que se busca la fila que
 * tenga "Clave" para saber dónde empiezan los datos y qué columna es cuál.
 */
export function parseProductCatalogWorkbook(buffer: Buffer): ParsedCatalogRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("El archivo no tiene hojas.");
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

  const headerIdx = aoa.findIndex((row) => row.some((cell) => normalizeHeader(cell) === "clave"));
  if (headerIdx === -1) throw new Error('No se encontró la fila de encabezado (se busca una columna "Clave").');

  const columnMap = new Map<number, keyof ParsedCatalogRow>();
  aoa[headerIdx].forEach((cell, i) => {
    const key = HEADER_ALIASES[normalizeHeader(cell)];
    if (key && key !== "skip") columnMap.set(i, key);
  });
  if (![...columnMap.values()].includes("barcode")) throw new Error('No se reconoció la columna "Clave".');
  if (![...columnMap.values()].includes("description")) throw new Error('No se reconoció la columna "Descripción".');

  const rows: ParsedCatalogRow[] = [];
  for (const raw of aoa.slice(headerIdx + 1)) {
    const partial: Partial<Record<keyof ParsedCatalogRow, unknown>> = {};
    columnMap.forEach((key, i) => {
      partial[key] = raw[i];
    });
    const barcode = String(partial.barcode ?? "").trim();
    const description = String(partial.description ?? "").trim();
    if (!barcode || !description) continue;
    rows.push({
      barcode,
      description,
      department: partial.department ? String(partial.department).trim() : null,
      category: partial.category ? String(partial.category).trim() : null,
      unit: partial.unit ? String(partial.unit).trim() : null,
      salePrice: toNumberOrNull(partial.salePrice),
      salePriceNet: toNumberOrNull(partial.salePriceNet),
    });
  }
  return rows;
}

const CHUNK_SIZE = 500;

/** Reemplaza todo el catálogo con lo que traiga el archivo nuevo — siempre refleja el export más reciente de SICAR X. */
export async function replaceProductCatalog(rows: ParsedCatalogRow[]): Promise<number> {
  const db = supabaseAdmin();
  const { error: delErr } = await db.from("product_catalog").delete().neq("barcode", "");
  if (delErr) throw new Error(`No se pudo limpiar el catálogo anterior: ${delErr.message}`);

  const now = new Date().toISOString();
  // Un mismo código de barras puede repetirse en el export; nos quedamos con el último.
  const byBarcode = new Map<string, ParsedCatalogRow>();
  for (const r of rows) byBarcode.set(r.barcode, r);
  const unique = [...byBarcode.values()];

  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    const chunk = unique.slice(i, i + CHUNK_SIZE).map((r) => ({
      barcode: r.barcode,
      description: r.description,
      department: r.department,
      category: r.category,
      unit: r.unit,
      sale_price: r.salePrice,
      sale_price_net: r.salePriceNet,
      updated_at: now,
    }));
    const { error } = await db.from("product_catalog").insert(chunk);
    if (error) throw new Error(`No se pudo guardar el catálogo: ${error.message}`);
  }
  return unique.length;
}
