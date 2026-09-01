// Supabase Edge Function · parse-ticket
// Recibe las fotos de un ticket de proveedor y devuelve los renglones estructurados.
// Se invoca desde la app con supabase.functions.invoke('parse-ticket', { body })
// El JWT del usuario se valida automáticamente (verify_jwt = true).
import Anthropic from "npm:@anthropic-ai/sdk@0.123.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.123.0/helpers/zod";
import { z } from "npm:zod@4.1.13";

const Linea = z.object({
  clave: z.string().nullable().describe("Clave numérica del proveedor impresa bajo la descripción (ej. 401586)"),
  descripcion: z.string().describe("Descripción tal como aparece en el ticket"),
  cantidad: z.number().describe("Cantidad de unidades del renglón"),
  precio_unitario: z.number().describe("Precio unitario ya con descuento aplicado"),
  total: z.number().describe("Total del renglón impreso"),
  lote: z.string().nullable().describe("Lote (LT.) sin el prefijo"),
  caducidad: z.string().nullable().describe("Caducidad en formato YYYY-MM-DD"),
  confianza: z.enum(["alta", "media", "baja"]).describe("Qué tan legible estaba el renglón"),
});

const Ticket = z.object({
  proveedor: z.string().nullable(),
  rfc: z.string().nullable(),
  sucursal: z.string().nullable(),
  ticket_numero: z.string().nullable(),
  fecha: z.string().nullable().describe("YYYY-MM-DD"),
  importe: z.number().nullable().describe("Importe total impreso"),
  ahorro: z.number().nullable(),
  piezas: z.number().nullable().describe("Total de piezas impreso"),
  lineas: z.array(Linea),
  observaciones: z.string().nullable().describe("Dudas de lectura o renglones ilegibles"),
});

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

type ImageIn = { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { images } = (await req.json()) as { images: ImageIn[] };
    if (!Array.isArray(images) || images.length === 0) return json({ error: "Faltan las fotos del ticket" }, 400);
    if (images.length > 8) return json({ error: "Máximo 8 fotos por ticket" }, 400);

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const content: Anthropic.ContentBlockParam[] = images.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.media_type, data: img.data },
    }));
    content.push({
      type: "text",
      text: `Transcribe este ticket (${images.length} foto(s), en orden de arriba hacia abajo).`,
    });

    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: zodOutputFormat(Ticket) },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") return json({ error: "El modelo rechazó la lectura" }, 502);
    if (!response.parsed_output) return json({ error: "No se pudo estructurar la respuesta" }, 502);

    return json({ ticket: response.parsed_output, usage: response.usage });
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? `API ${err.status}: ${err.message}` : String(err);
    console.error(message);
    return json({ error: message }, 500);
  }
});
