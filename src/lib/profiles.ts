import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { ProfileRole } from "@/lib/admin-auth";

export interface Profile {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: ProfileRole;
  shift: string;
  weekly_salary: number;
  shifts_per_week: number;
  active: boolean;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin().from("profiles").select().eq("username", username.toLowerCase()).single();
  if (error) return null;
  return data as Profile;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin().from("profiles").select().eq("id", id).single();
  if (error) return null;
  return data as Profile;
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin().from("profiles").select().order("full_name");
  if (error) throw new Error(`No se pudieron leer los empleados: ${error.message}`);
  return data as Profile[];
}
