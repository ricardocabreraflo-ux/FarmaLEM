import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
}

export async function listSuppliers(onlyActive = false): Promise<Supplier[]> {
  let query = supabaseAdmin().from("suppliers").select().order("name");
  if (onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron leer los proveedores: ${error.message}`);
  return data as Supplier[];
}

export async function createSupplier(name: string, contact: string | null, createdBy: string): Promise<void> {
  const { error } = await supabaseAdmin().from("suppliers").insert({ name, contact, created_by: createdBy, active: true });
  if (error) throw new Error(error.message);
}
