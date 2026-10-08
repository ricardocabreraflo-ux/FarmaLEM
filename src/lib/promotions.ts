import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
}

export async function listPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabaseAdmin().from("promotions").select().order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las promociones: ${error.message}`);
  return data as Promotion[];
}

export async function listActivePromotions(): Promise<Promotion[]> {
  const { data, error } = await supabaseAdmin().from("promotions").select().eq("active", true).order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las promociones: ${error.message}`);
  return data as Promotion[];
}

export async function createPromotion(title: string, description: string | null, createdBy: string): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").insert({ title, description, created_by: createdBy });
  if (error) throw new Error(`No se pudo guardar la promoción: ${error.message}`);
}

export async function setPromotionActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").update({ active }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
}
