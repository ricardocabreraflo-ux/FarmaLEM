import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

const ROW_ID = "00000000-0000-0000-0000-000000000001";

export async function hasDeletePin(): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("security_settings").select("delete_pin_hash").eq("id", ROW_ID).single();
  if (error) return false;
  return Boolean(data?.delete_pin_hash);
}

export async function getDeletePinHash(): Promise<string | null> {
  const { data, error } = await supabaseAdmin().from("security_settings").select("delete_pin_hash").eq("id", ROW_ID).single();
  if (error) return null;
  return data?.delete_pin_hash ?? null;
}

export async function saveDeletePinHash(hash: string): Promise<void> {
  const { error } = await supabaseAdmin().from("security_settings").upsert({ id: ROW_ID, delete_pin_hash: hash });
  if (error) throw new Error(error.message);
}
