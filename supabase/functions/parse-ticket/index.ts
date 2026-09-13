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
 * Tickets con muchas fotos (densos, varias páginas) pueden tardar más de los
 * 150s que aguanta la función — ya pasó con un ticket de 5 fotos (546 =
 * tiempo agotado). Por arriba de este umbral partimos las fotos en dos
 * mitades y las transcribimos en paralelo (dos llamadas más chicas en vez de
 * una grande), para quedar cómodos bajo el límite.
 */
const SPLIT_THRESHOLD = 4;

async function transcribe(client: Anthropic, images: ImageIn[], note: string): Promise<{ ticket: TicketOut; usage: Anthropic.Usage }> {
  const content: Anthropic.ContentBlockParam[] = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.media_type, data: img.data },
  }));
  content.push({ type: "text", text: `Transcribe este ticket (${images.length} foto(s), en orden de arriba hacia abajo).${note}` });

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(Ticket) },
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") throw new Error("El modelo rechazó la lectura");
  if (!response.parsed_output) throw new Error("No se pudo estructurar la respuesta");
  return { ticket: response.parsed_output, usage: response.usage };
}

/** proveedor/folio/fecha suelen ir en las primeras fotos; los totales, en las últimas. */
function mergeTickets(first: TicketOut, last: TicketOut): TicketOut {
  return {
    proveedor: first.proveedor ?? last.proveedor,
    rfc: first.rfc ?? last.rfc,
    sucursal: first.sucursal ?? last.sucursal,
    ticket_numero: first.ticket_numero ?? last.ticket_numero,
    fecha: first.fecha ?? last.fecha,
    importe: last.importe ?? first.importe,
    ahorro: last.ahorro ?? first.ahorro,
    piezas: last.piezas ?? first.piezas,
    lineas: [...first.lineas, ...last.lineas],
    observaciones: [first.observaciones, last.observaciones].filter(Boolean).join(" · ") || null,
  };
}

function sumUsage(a: Anthropic.Usage, b: Anthropic.Usage): Anthropic.Usage {
  return { ...a, input_tokens: (a.input_tokens ?? 0) + (b.input_tokens ?? 0), output_tokens: (a.output_tokens ?? 0) + (b.output_tokens ?? 0) };
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

    let ticket: TicketOut;
    let usage: Anthropic.Usage;
    if (images.length <= SPLIT_THRESHOLD) {
      const r = await transcribe(client, images, "");
      ticket = r.ticket;
      usage = r.usage;
    } else {
      const mid = Math.ceil(images.length / 2);
      const [ra, rb] = await Promise.all([
        transcribe(client, images.slice(0, mid), ` Es la primera mitad de un ticket más largo (fotos 1 a ${mid} de ${images.length}).`),
        transcribe(
          client,
          images.slice(mid),
          ` Es la segunda mitad de un ticket más largo (fotos ${mid + 1} a ${images.length} de ${images.length}); son renglones nuevos, no repitas los de la primera mitad.`
        ),
      ]);
      ticket = mergeTickets(ra.ticket, rb.ticket);
      usage = sumUsage(ra.usage, rb.usage);
    }

    return json({ ticket, usage });
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? `API ${err.status}: ${err.message}` : err instanceof Error ? err.message : String(err);
    console.error(message);
    return json({ error: message }, 500);
  }
});
