import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  supplier_code: string;
  supplier_description: string | null;
  barcode: string;
  description: string;
  sale_price: number | null;
  pack_factor: number;
  last_unit_price: number | null;
  last_seen_at: string | null;
}

/** Catálogo de equivalencias de un proveedor, por clave del proveedor — para cruzar los renglones de un ticket nuevo. */
export async function listSupplierCatalog(supplierId: string): Promise<Map<string, SupplierProduct>> {
  const { data, error } = await supabaseAdmin().from("supplier_products").select().eq("supplier_id", supplierId);
  if (error) throw new Error(`No se pudo leer el catálogo del proveedor: ${error.message}`);
  const map = new Map<string, SupplierProduct>();
  for (const row of (data ?? []) as SupplierProduct[]) map.set(row.supplier_code, row);
  return map;
}

export interface EquivalenceInput {
  supplierId: string;
  supplierCode: string;
  supplierDescription: string | null;
  barcode: string;
  description: string;
  salePrice: number | null;
  packFactor: number;
  lastUnitPrice: number;
}

/** Da de alta o actualiza las equivalencias clave→producto que se acaban de usar en una recepción. */
export async function upsertEquivalences(rows: EquivalenceInput[]): Promise<void> {
  if (rows.length === 0) return;
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin()
    .from("supplier_products")
    .upsert(
      rows.map((r) => ({
        supplier_id: r.supplierId,
        supplier_code: r.supplierCode,
        supplier_description: r.supplierDescription,
        barcode: r.barcode,
        description: r.description,
        sale_price: r.salePrice,
        pack_factor: r.packFactor,
        last_unit_price: r.lastUnitPrice,
        last_seen_at: now,
        updated_at: now,
      })),
      { onConflict: "supplier_id,supplier_code" }
    );
  if (error) throw new Error(`No se pudieron guardar las equivalencias: ${error.message}`);
}
