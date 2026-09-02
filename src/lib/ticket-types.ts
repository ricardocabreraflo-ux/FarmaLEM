// Tipos compartidos con el resultado de leer un ticket de proveedor. La
// lectura en sí corre en la Edge Function de Supabase (supabase/functions/parse-ticket),
// no aquí — este archivo solo describe la forma de esos datos, para usarse
// tanto en el cliente (ReceiptCaptureFlow) como en el servidor (purchase-receipts).

export type Confidence = "alta" | "media" | "baja";

export interface ParsedLine {
  clave: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  lote: string | null;
  caducidad: string | null;
  confianza: Confidence;
}

export interface ParsedTicket {
  proveedor: string | null;
  rfc: string | null;
  sucursal: string | null;
  ticket_numero: string | null;
  fecha: string | null;
  importe: number | null;
  ahorro: number | null;
  piezas: number | null;
  lineas: ParsedLine[];
  observaciones: string | null;
}

export interface TicketImage {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  data: string; // base64, sin el prefijo data:...
}
