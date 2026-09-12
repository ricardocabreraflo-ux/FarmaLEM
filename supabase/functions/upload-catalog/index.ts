// Supabase Edge Function · upload-catalog
// Recibe el archivo "Productos Exportados" de SICAR X (base64) y reemplaza
// por completo farmalem.product_catalog. Se llama directo desde el
// navegador (fetch con la anon key), igual que parse-ticket, porque parsear
// ~3500 renglones y reemplazarlos en la base de datos puede tardar más de
// lo que aguantan las funciones de Netlify (10-26s) — las Edge Functions de
// Supabase aguantan hasta 150s. Usa el service role key (inyectado
// automáticamente por Supabase) para poder borrar/insertar sin pasar por
// las políticas de la tabla.
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const HEADER_ALIASES: Record<string, string> = {
  clave: "barcode",
  "código de barras": "barcode",
  "codigo de barras": "barcode",
  "descripción": "description",
  descripcion: "description",
  departamento: "department",
  "categoría": "category",
  categoria: "category",
  unidad: "unit",
  precio: "sale_price",
  "precio neto": "sale_price_net",
};

function normalizeHeader(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { file_base64 } = (await req.json()) as { file_base64?: string };
    if (!file_base64) return json({ error: "Falta el archivo." }, 400);

    const binary = Uint8Array.from(atob(file_base64), (c) => c.charCodeAt(0));
    const wb = XLSX.read(binary, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return json({ error: "El archivo no tiene hojas." }, 400);
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];

    const headerIdx = aoa.findIndex((row) => row.some((cell) => normalizeHeader(cell) === "clave"));
    if (headerIdx === -1) return json({ error: 'No se encontró la fila de encabezado (se busca una columna "Clave").' }, 400);

    const columnMap = new Map<number, string>();
    aoa[headerIdx].forEach((cell, i) => {
      const key = HEADER_ALIASES[normalizeHeader(cell)];
      if (key) columnMap.set(i, key);
    });
    const mappedKeys = new Set(columnMap.values());
    if (!mappedKeys.has("barcode")) return json({ error: 'No se reconoció la columna "Clave".' }, 400);
    if (!mappedKeys.has("description")) return json({ error: 'No se reconoció la columna "Descripción".' }, 400);

    const byBarcode = new Map<string, Record<string, unknown>>();
    for (const raw of aoa.slice(headerIdx + 1)) {
      const row: Record<string, unknown> = {};
      columnMap.forEach((key, i) => {
        row[key] = raw[i];
      });
      const barcode = String(row.barcode ?? "").trim();
      const description = String(row.description ?? "").trim();
      if (!barcode || !description) continue;
      byBarcode.set(barcode, {
        barcode,
        description,
        department: row.department ? String(row.department).trim() : null,
        category: row.category ? String(row.category).trim() : null,
        unit: row.unit ? String(row.unit).trim() : null,
        sale_price: toNumberOrNull(row.sale_price),
        sale_price_net: toNumberOrNull(row.sale_price_net),
      });
    }
    const rows = [...byBarcode.values()];
    if (rows.length === 0) return json({ error: "El archivo no trae renglones con clave y descripción." }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!).schema("farmalem");

    const { error: delErr } = await supabase.from("product_catalog").delete().neq("barcode", "");
    if (delErr) throw delErr;

    const now = new Date().toISOString();
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map((r) => ({ ...r, updated_at: now }));
      const { error } = await supabase.from("product_catalog").insert(chunk);
      if (error) throw error;
    }

    return json({ ok: true, count: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("upload-catalog failed:", message);
    return json({ error: message }, 500);
  }
});
