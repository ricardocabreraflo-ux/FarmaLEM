import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

const IMAGE_BUCKET = "farmalem-documents";

export interface Announcement {
  id: string;
  title: string;
  description: string;
  href: string | null;
  imageUrl: string;
  acked: boolean;
}

/**
 * Anuncios activos para el banner "qué hay de nuevo" del Inicio, con su
 * imagen ya firmada y si quien lo ve ya le dio "Ya lo vi". `roleId` es el rol
 * de permisos de quien lo ve — un anuncio con `visible_role_ids` vacío/null
 * es para todo el equipo; con roles puestos, solo se le muestra a quien
 * tenga alguno de esos roles (para no anunciar una función que ese rol no
 * tiene habilitada).
 */
export async function listActiveAnnouncements(roleId: string | null, employeeId: string): Promise<Announcement[]> {
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

  const [{ data: signed, error: signErr }, { data: acks, error: acksErr }] = await Promise.all([
    db.storage.from(IMAGE_BUCKET).createSignedUrls(
      visible.map((a) => a.image_path),
      60 * 60
    ),
    db
      .from("announcement_acks")
      .select("announcement_id")
      .eq("employee_id", employeeId)
      .in(
        "announcement_id",
        visible.map((a) => a.id)
      ),
  ]);
  if (signErr) throw new Error(`No se pudieron firmar las imágenes de anuncios: ${signErr.message}`);
  if (acksErr) throw new Error(`No se pudieron leer las confirmaciones: ${acksErr.message}`);
  const ackedIds = new Set((acks ?? []).map((a) => a.announcement_id as string));

  return visible.map((a, i) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    href: a.href,
    imageUrl: signed?.[i]?.signedUrl ?? "",
    acked: ackedIds.has(a.id),
  }));
}

export async function getAnnouncementTitle(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin().from("dashboard_announcements").select("title").eq("id", id).maybeSingle();
  return data?.title ?? null;
}

/**
 * Marca que esta persona ya vio ese anuncio ("Ya lo vi") y avisa a
 * administración por notificación push — nunca truena el flujo que la
 * llama si el aviso falla, el "visto" ya quedó guardado de todas formas.
 */
export async function ackAnnouncement(announcementId: string, employeeId: string): Promise<void> {
  const db = supabaseAdmin();
  const { error } = await db.from("announcement_acks").upsert({ announcement_id: announcementId, employee_id: employeeId }, { onConflict: "announcement_id,employee_id", ignoreDuplicates: true });
  if (error) throw new Error(`No se pudo guardar tu confirmación: ${error.message}`);
}
