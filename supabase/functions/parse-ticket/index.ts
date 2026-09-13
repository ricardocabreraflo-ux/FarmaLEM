// Supabase Edge Function · parse-ticket
// Recibe las fotos de un ticket de proveedor y devuelve los renglones estructurados.
// Se llama directo desde el navegador (fetch con la anon key) porque la
// lectura tarda 30-60s y eso excede el límite de las funciones de Netlify
// (10-26s) donde corre el resto de la app — Supabase Edge Functions aguantan
// hasta 150s. verify_jwt=true valida la anon key como JWT; ANTHROPIC_API_KEY
// se configura como secreto del proyecto (Edge Functions → Secrets), nunca en
// el código ni en el cliente.
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
type TicketOut = z.infer<typeof Ticket>;

/**
 * Tickets con muchas fotos (densos, varias páginas) generan demasiados
 * renglones para una sola llamada: ya pasó tiempo agotado (150s) con 5 fotos,
 * y JSON truncado (max_tokens insuficiente) con un ticket todavía más denso.
 * Por eso las fotos se agrupan de a lo más GROUP_SIZE y cada grupo se manda
 * en paralelo como una llamada aparte y más chica.
 */
const GROUP_SIZE = 3;
// El SDK exige streaming para max_tokens grandes (>10 min estimados de
// generación) y esta función no transmite por streaming — 32000 ya lo
// disparaba de inmediato, sin ni siquiera llamar al modelo. 16000 es el
// valor que ya veníamos usando sin ese problema; el agrupado de a lo más
// GROUP_SIZE fotos por llamada es lo que evita que se trunque un ticket denso.
const MAX_TOKENS = 16000;

function chunk<T>(items: T[], groupSize: number): T[][] {
  const groups = Math.ceil(items.length / groupSize);
  const perGroup = Math.ceil(items.length / groups);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += perGroup) out.push(items.slice(i, i + perGroup));
  return out;
}

async function transcribe(client: Anthropic, images: ImageIn[], note: string): Promise<{ ticket: TicketOut; usage: Anthropic.Usage }> {
  const content: Anthropic.ContentBlockParam[] = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.media_type, data: img.data },
  }));
  content.push({ type: "text", text: `Transcribe este ticket (${images.length} foto(s), en orden de arriba hacia abajo).${note}` });

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: MAX_TOKENS,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(Ticket) },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") throw new Error("El modelo rechazó la lectura");
  if (response.stop_reason === "max_tokens") throw new Error("La respuesta se cortó por ser demasiado larga — sube menos fotos por intento");
  if (!response.parsed_output) throw new Error("No se pudo estructurar la respuesta");
  return { ticket: response.parsed_output, usage: response.usage };
}

/** proveedor/folio/fecha suelen ir en las primeras fotos; los totales, en las últimas. */
function mergeTickets(parts: TicketOut[]): TicketOut {
  const first = parts[0];
  const last = parts[parts.length - 1];
  return {
    proveedor: parts.map((p) => p.proveedor).find(Boolean) ?? null,
    rfc: parts.map((p) => p.rfc).find(Boolean) ?? null,
    sucursal: parts.map((p) => p.sucursal).find(Boolean) ?? null,
    ticket_numero: parts.map((p) => p.ticket_numero).find(Boolean) ?? null,
    fecha: first.fecha ?? parts.map((p) => p.fecha).find(Boolean) ?? null,
    importe: last.importe ?? [...parts].reverse().map((p) => p.importe).find((v) => v != null) ?? null,
    ahorro: last.ahorro ?? [...parts].reverse().map((p) => p.ahorro).find((v) => v != null) ?? null,
    piezas: last.piezas ?? [...parts].reverse().map((p) => p.piezas).find((v) => v != null) ?? null,
    lineas: parts.flatMap((p) => p.lineas),
    observaciones: parts.map((p) => p.observaciones).filter(Boolean).join(" · ") || null,
  };
}

function sumUsage(usages: Anthropic.Usage[]): Anthropic.Usage {
  return usages.reduce((acc, u) => ({
    ...acc,
    input_tokens: (acc.input_tokens ?? 0) + (u.input_tokens ?? 0),
    output_tokens: (acc.output_tokens ?? 0) + (u.output_tokens ?? 0),
  }));
}

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

    const groups = chunk(images, GROUP_SIZE);
    let ticket: TicketOut;
    let usage: Anthropic.Usage;
    if (groups.length <= 1) {
      const r = await transcribe(client, images, "");
      ticket = r.ticket;
      usage = r.usage;
    } else {
      let photoIdx = 0;
      const results = await Promise.all(
        groups.map((g) => {
          const from = photoIdx + 1;
          photoIdx += g.length;
          const note = ` Es una parte de un ticket más largo (fotos ${from} a ${photoIdx} de ${images.length}, en ese orden); son renglones nuevos que no aparecen en las otras partes, no los repitas ni inventes continuidad.`;
          return transcribe(client, g, note);
        })
      );
      ticket = mergeTickets(results.map((r) => r.ticket));
      usage = sumUsage(results.map((r) => r.usage));
    }

    return json({ ticket, usage });
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? `API ${err.status}: ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error(message);
    return json({ error: message }, 500);
  }
});
