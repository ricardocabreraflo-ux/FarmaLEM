import type { ParsedTicket, TicketImage } from "@/lib/ticket-types";

/**
 * Llama directo desde el navegador a la Edge Function de Supabase que lee
 * las fotos del ticket con Claude (30-60s). Se llama directo (no a través de
 * un Server Action de Next.js) porque las funciones de Netlify tienen un
 * límite de 10-26s — mucho menos de lo que tarda la lectura — mientras que
 * las Edge Functions de Supabase aguantan hasta 150s.
 *
 * Usa la anon key (pensada para exponerse en el cliente); la llave de
 * Anthropic vive solo como secreto dentro de la Edge Function, nunca aquí.
 */
export async function parseTicketPhotosClient(images: TicketImage[]): Promise<ParsedTicket> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Falta configurar NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");

  const res = await fetch(`${url}/functions/v1/parse-ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      images: images.map((img) => ({ media_type: img.mediaType, data: img.data })),
    }),
  });

  let body: { ticket?: ParsedTicket; error?: string };
  try {
    body = await res.json();
  } catch {
    throw new Error(`El servidor de lectura respondió algo inesperado (HTTP ${res.status}).`);
  }
  if (!res.ok || !body.ticket) throw new Error(body.error ?? `No se pudo leer el ticket (HTTP ${res.status}).`);
  return body.ticket;
}
