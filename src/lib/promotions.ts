import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

const IMAGE_BUCKET = "farmalem-documents";

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  image_path: string | null;
  created_by: string;
  created_at: string;
}

export async function listPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabaseAdmin().from("promotions").select().order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las promociones: ${error.message}`);
  return data as Promotion[];
}

export interface PromotionWithImage extends Promotion {
  imageUrl: string | null;
  downloadUrl: string | null;
}

function downloadFilename(title: string, path: string): string {
  const ext = path.split(".").pop() || "jpg";
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "promocion"}.${ext}`;
}

async function withImageUrls(promos: Promotion[]): Promise<PromotionWithImage[]> {
  return Promise.all(
    promos.map(async (p) => ({
      ...p,
      imageUrl: p.image_path ? await getPromotionImageUrl(p.image_path) : null,
      downloadUrl: p.image_path ? await getPromotionImageDownloadUrl(p.image_path, downloadFilename(p.title, p.image_path)) : null,
    }))
  );
}

/** Para Configuración: cada promoción con su imagen ya firmada (si tiene), lista para mostrarse o descargarse. */
export async function listPromotionsWithImages(): Promise<PromotionWithImage[]> {
  return withImageUrls(await listPromotions());
}

/** Para el equipo en Inicio: solo las activas, con su imagen lista para ver o descargar e imprimir. */
export async function listActivePromotionsWithImages(): Promise<PromotionWithImage[]> {
  return withImageUrls(await listActivePromotions());
}

export async function listActivePromotions(): Promise<Promotion[]> {
  const { data, error } = await supabaseAdmin().from("promotions").select().eq("active", true).order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las promociones: ${error.message}`);
  return data as Promotion[];
}

export async function createPromotion(title: string, description: string | null, imagePath: string | null, createdBy: string): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").insert({ title, description, image_path: imagePath, created_by: createdBy });
  if (error) throw new Error(`No se pudo guardar la promoción: ${error.message}`);
}

export async function setPromotionActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").update({ active }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
}

export async function setPromotionImage(id: string, imagePath: string): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").update({ image_path: imagePath }).eq("id", id);
  if (error) throw new Error(`No se pudo guardar la imagen: ${error.message}`);
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("promotions").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
}

export async function uploadPromotionImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `promociones/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin()
    .storage.from(IMAGE_BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg" });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return path;
}

/** Para verla en pantalla (sin forzar descarga) — igual vence en 1h, se vuelve a firmar en cada carga de la página. */
export async function getPromotionImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().storage.from(IMAGE_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

/** Para el botón "Descargar para imprimir" — el navegador la guarda en vez de solo mostrarla. */
export async function getPromotionImageDownloadUrl(path: string, filename: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().storage.from(IMAGE_BUCKET).createSignedUrl(path, 60 * 60, { download: filename });
  if (error) return null;
  return data.signedUrl;
}
