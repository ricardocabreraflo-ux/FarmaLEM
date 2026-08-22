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
  daily_rate: number;
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

interface ProfileInput {
  username: string;
  fullName: string;
  role: ProfileRole;
  shift: string;
  dailyRate: number;
  active: boolean;
}

/** Lanza un Error con mensaje claro si el usuario ya existe; cualquier otro código se relanza tal cual. */
function throwFriendly(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new Error("Ese usuario ya existe.");
  throw new Error(error.message);
}

export async function createProfile(input: ProfileInput, passwordHash: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("profiles")
    .insert({
      username: input.username.toLowerCase(),
      password_hash: passwordHash,
      full_name: input.fullName,
      role: input.role,
      shift: input.shift,
      daily_rate: input.dailyRate,
      active: input.active,
    });
  if (error) throwFriendly(error);
}

export async function updateProfile(id: string, input: ProfileInput, passwordHash: string | null): Promise<void> {
  const patch: Record<string, unknown> = {
    username: input.username.toLowerCase(),
    full_name: input.fullName,
    role: input.role,
    shift: input.shift,
    daily_rate: input.dailyRate,
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  if (passwordHash) patch.password_hash = passwordHash;

  const { error } = await supabaseAdmin().from("profiles").update(patch).eq("id", id);
  if (error) throwFriendly(error);
}
