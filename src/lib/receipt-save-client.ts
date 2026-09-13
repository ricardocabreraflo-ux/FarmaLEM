import type { ParsedTicket } from "@/lib/ticket-types";

export interface SaveReceiptLineInput {
  supplierCode: string | null;
  ticketDescription: string | null;
  quantity: number;
  unitPrice: number;
  lot: string | null;
  expiresOn: string | null;
  barcode: string;
  description: string;
  salePrice: number | null;
  packFactor: number;
}

export interface SaveReceiptPhotoInput {
  base64: string;
  contentType: string;
  filename: string;
}

export interface SaveReceiptClientInput {
  supplierId: string;
  createdBy: string;
  ticketNumber: string | null;
  ticketDate: string;
  ticketTotal: number | null;
  ticketPieces: number | null;
  ticketSavings: number | null;
  notes: string | null;
  rawExtraction: ParsedTicket | null;
  lines: SaveReceiptLineInput[];
  photos: SaveReceiptPhotoInput[];
}

/**
 * Llama directo desde el navegador a la Edge Function de Supabase que
 * guarda la recepción completa (encabezado, fotos, renglones y movimientos
 * de compra). Se llama directo (no a través de un Server Action de Next.js)
 * porque tickets grandes (muchos renglones o varias fotos) pueden tardar
 * más de lo que aguantan las funciones de Netlify (10-26s) — las Edge
 * Functions de Supabase aguantan hasta 150s.
 *
 * Usa la anon key (pensada para exponerse en el cliente); el service role
 * vive solo como secreto dentro de la Edge Function.
 */
export async function saveReceiptClient(input: SaveReceiptClientInput): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Falta configurar NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");

  const res = await fetch(`${url}/functions/v1/save-receipt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify(input),
  });

  let body: { id?: string; error?: string };
  try {
    body = await res.json();
  } catch {
    throw new Error(`El servidor respondió algo inesperado (HTTP ${res.status}).`);
  }
  if (!res.ok || !body.id) throw new Error(body.error ?? `No se pudo guardar la recepción (HTTP ${res.status}).`);
  return body.id;
}
