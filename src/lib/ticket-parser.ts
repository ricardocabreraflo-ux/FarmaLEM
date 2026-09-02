import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const LineaSchema = z.object({
  clave: z.string().nullable().describe("Clave numérica del proveedor impresa bajo la descripción (ej. 401586)"),
  descripcion: z.string().describe("Descripción tal como aparece en el ticket"),
  cantidad: z.number().describe("Cantidad de unidades del renglón"),
  precio_unitario: z.number().describe("Precio unitario ya con descuento aplicado"),
  total: z.number().describe("Total del renglón impreso"),
  lote: z.string().nullable().describe("Lote (LT.) sin el prefijo"),
  caducidad: z.string().nullable().describe("Caducidad en formato YYYY-MM-DD"),
  confianza: z.enum(["alta", "media", "baja"]).describe("Qué tan legible estaba el renglón"),
});

const TicketSchema = z.object({
  proveedor: z.string().nullable(),
  rfc: z.string().nullable(),
  sucursal: z.string().nullable(),
  ticket_numero: z.string().nullable(),
  fecha: z.string().nullable().describe("YYYY-MM-DD"),
  importe: z.number().nullable().describe("Importe total impreso"),
  ahorro: z.number().nullable(),
  piezas: z.number().nullable().describe("Total de piezas impreso"),
  lineas: z.array(LineaSchema),
  observaciones: z.string().nullable().describe("Dudas de lectura o renglones ilegibles"),
});

export type ParsedLine = z.infer<typeof LineaSchema>;
export type ParsedTicket = z.infer<typeof TicketSchema>;

const SYSTEM = `Eres un capturista experto de una farmacia en México. Recibes fotos de un ticket de compra
a un proveedor mayorista (por ejemplo Farmamigo). Tu trabajo es transcribir TODOS los renglones de productos
con exactitud, sin inventar nada.

Reglas:
- Las fotos pueden traslaparse: el mismo renglón puede aparecer en dos fotos. Reporta cada renglón UNA sola vez,
  en el orden en que aparece en el ticket.
- Cada renglón del ticket suele ocupar 3 líneas: descripción, "clave  cantidad  precio  total" y "LT.lote CAD.dd/mm/aaaa".
- Si un renglón tiene descuento (D1/D2/D3), el precio unitario es el ya descontado que aparece en la línea de cantidad.
- Convierte fechas dd/mm/aaaa a YYYY-MM-DD.
- Si no se lee un dato, ponlo en null y marca confianza "baja"; no adivines.
- Verifica que cantidad × precio_unitario ≈ total en cada renglón; si no cuadra, revisa la lectura.
- Extrae también los totales del ticket (importe, ahorro, piezas) si se ven.`;

export interface TicketImage {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  data: string; // base64, sin el prefijo data:...
}

/**
 * Lee las fotos de un ticket de proveedor con Claude y regresa los renglones
 * estructurados. Corre en el servidor (Server Action) con ANTHROPIC_API_KEY
 * como variable de entorno secreta — no se expone al navegador.
 */
export async function parseTicketPhotos(images: TicketImage[]): Promise<ParsedTicket> {
  if (images.length === 0) throw new Error("Faltan las fotos del ticket.");
  if (images.length > 8) throw new Error("Máximo 8 fotos por ticket.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY en las variables de entorno del servidor.");

  const client = new Anthropic({ apiKey });
  const content: Anthropic.ContentBlockParam[] = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.data },
  }));
  content.push({ type: "text", text: `Transcribe este ticket (${images.length} foto(s), en orden de arriba hacia abajo).` });

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: zodOutputFormat(TicketSchema) },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") throw new Error("El modelo rechazó la lectura del ticket.");
  if (!response.parsed_output) throw new Error("No se pudo estructurar la lectura del ticket.");
  return response.parsed_output;
}
