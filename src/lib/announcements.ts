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

/** Anuncios activos para el banner "qué hay de nuevo" del Inicio, con su imagen ya firmada. */
export async function listActiveAnnouncements(): Promise<Announcement[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("dashboard_announcements")
    .select("id, title, description, image_path, href")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los anuncios: ${error.message}`);
  if (!data || data.length === 0) return [];

  const paths = data.map((a) => a.image_path);
  const { data: signed, error: signErr } = await db.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60);
  if (signErr) throw new Error(`No se pudieron firmar las imágenes de anuncios: ${signErr.message}`);

  return data.map((a, i) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    href: a.href,
    imageUrl: signed?.[i]?.signedUrl ?? "",
  }));
}
