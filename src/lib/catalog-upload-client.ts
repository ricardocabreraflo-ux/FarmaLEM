/**
 * Sube el archivo de catálogo directo a la Edge Function de Supabase
 * (no pasa por un Server Action de Next.js) — reemplazar ~3500 renglones
 * puede tardar más de lo que aguantan las funciones de Netlify (10-26s),
 * mientras que las Edge Functions de Supabase aguantan hasta 150s. Usa la
 * anon key (pensada para exponerse en el cliente); el service role vive
 * solo como secreto dentro de la Edge Function.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function uploadCatalogFileClient(file: File): Promise<{ count: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Falta configurar NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");

  const fileBase64 = arrayBufferToBase64(await file.arrayBuffer());

  const res = await fetch(`${url}/functions/v1/upload-catalog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ file_base64: fileBase64 }),
  });

  let body: { ok?: boolean; count?: number; error?: string };
  try {
    body = await res.json();
  } catch {
    throw new Error(`El servidor respondió algo inesperado (HTTP ${res.status}).`);
  }
  if (!res.ok || !body.ok || body.count == null) throw new Error(body.error ?? `No se pudo subir el catálogo (HTTP ${res.status}).`);
  return { count: body.count };
}
