import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

const IMAGE_BUCKET = "farmalem-documents";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  href: string | null;
  imageUrl: string;
}

/**
 * Anuncios activos para el banner "qué hay de nuevo" del Inicio, con su
 * imagen ya firmada. `roleId` es el rol de permisos de quien lo ve — un
 * anuncio con `visible_role_ids` vacío/null es para todo el equipo; con
 * roles puestos, solo se le muestra a quien tenga alguno de esos roles
 * (para no anunciar una función que ese rol no tiene habilitada).
 */
export async function listActiveAnnouncements(roleId: string | null): Promise<Announcement[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("dashboard_announcements")
    .select("id, title, description, image_path, href, visible_role_ids")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los anuncios: ${error.message}`);
  if (!data || data.length === 0) return [];

  const visible = data.filter((a) => {
    const roles = a.visible_role_ids as string[] | null;
    if (!roles || roles.length === 0) return true;
    return roleId ? roles.includes(roleId) : false;
  });
  if (visible.length === 0) return [];

  const paths = visible.map((a) => a.image_path);
  const { data: signed, error: signErr } = await db.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60);
  if (signErr) throw new Error(`No se pudieron firmar las imágenes de anuncios: ${signErr.message}`);

  return visible.map((a, i) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    href: a.href,
    imageUrl: signed?.[i]?.signedUrl ?? "",
  }));
}
