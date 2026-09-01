import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para uso EXCLUSIVO del servidor (Server Actions, Route
 * Handlers). Usa la service_role key, que se salta RLS por completo — nunca
 * la importes desde un componente cliente ni la expongas al navegador.
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://iatyvxljzrcdfmmtesig.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=... (Supabase → Settings → API → service_role)
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno. " +
        "Revisa .env.example para configurarlas en .env.local."
    );
  }

  return createClient(url, serviceRoleKey, {
    db: { schema: "farmalem" },
    auth: { persistSession: false },
  });
}

let cached: ReturnType<typeof getSupabaseAdmin> | null = null;

/** Cliente admin (service role), con el schema `farmalem` ya seleccionado. */
export function supabaseAdmin() {
  if (!cached) cached = getSupabaseAdmin();
  return cached;
}
