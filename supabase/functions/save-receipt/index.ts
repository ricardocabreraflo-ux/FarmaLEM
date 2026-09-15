// Supabase Edge Function · save-receipt
// Guarda una recepción completa (encabezado, fotos, renglones y los
// movimientos de compra ya resueltos) de una sola vez. Se llama directo
// desde el navegador (fetch con la anon key), igual que parse-ticket y
// upload-catalog: con tickets grandes (decenas o cientos de renglones, o
// varias fotos), guardar puede tardar más de lo que aguantan las funciones
// de Netlify (10-26s) — las Edge Functions de Supabase aguantan hasta 150s.
// Usa el service role key (inyectado automáticamente por Supabase) para
// escribir sin pasar por las políticas de las tablas.
import { createClient } from "jsr:@supabase/supabase-js@2";

interface LineIn {
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

interface PhotoIn {
  base64: string;
  contentType: string;
  filename: string;
}

interface Payload {
  supplierId: string;
  createdBy: string;
  ticketNumber: string | null;
  ticketDate: string;
  ticketTotal: number | null;
  ticketPieces: number | null;
  ticketSavings: number | null;
  notes: string | null;
  rawExtraction: unknown | null;
  lines: LineIn[];
  photos: PhotoIn[];
}

const PHOTO_BUCKET = "farmalem-documents";

function isResolved(l: Pick<LineIn, "barcode" | "description" | "salePrice" | "quantity">): boolean {
  return Boolean(l.barcode.trim()) && Boolean(l.description.trim()) && l.salePrice != null && l.quantity > 0;
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
    const input = (await req.json()) as Payload;
    if (!input.supplierId) return json({ error: "Selecciona el proveedor." }, 400);
    if (!input.createdBy) return json({ error: "Falta el usuario." }, 400);
    if (!input.ticketDate) return json({ error: "Falta la fecha del ticket." }, 400);
    if (!Array.isArray(input.lines) || input.lines.length === 0) return json({ error: "No hay renglones que guardar." }, 400);
    if (input.lines.some((l) => !(l.quantity > 0))) return json({ error: "Hay un renglón con cantidad inválida." }, 400);

    // .schema("farmalem") regresa un cliente acotado solo a tablas/RPC de ese
    // esquema — pierde .storage y demás, por eso se guarda aparte el cliente
    // completo para subir las fotos.
    const raw = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const db = raw.schema("farmalem");

    const anyPending = input.lines.some((l) => !isResolved(l));
    const { data: receipt, error: rErr } = await db
      .from("purchase_receipts")
      .insert({
        supplier_id: input.supplierId,
        ticket_number: input.ticketNumber,
        ticket_date: input.ticketDate,
        ticket_total: input.ticketTotal,
        ticket_pieces: input.ticketPieces,
        ticket_savings: input.ticketSavings,
        notes: input.notes,
        raw_extraction: input.rawExtraction,
        status: anyPending ? "Pendiente" : "Completa",
        created_by: input.createdBy,
      })
      .select("id")
      .single();
    if (rErr) throw new Error(`No se pudo crear la recepción: ${rErr.message}`);
    const receiptId = receipt.id as string;

    if (input.photos.length > 0) {
      const paths = await Promise.all(
        input.photos.map(async (p, i) => {
          const ext = (p.filename.split(".").pop() || "jpg").toLowerCase();
          const path = `recepciones/${receiptId}/foto-${i + 1}.${ext}`;
          const bytes = Uint8Array.from(atob(p.base64), (c) => c.charCodeAt(0));
          const { error } = await raw.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType: p.contentType || "image/jpeg", upsert: true });
          if (error) throw new Error(`No se pudo subir la foto ${i + 1}: ${error.message}`);
          return path;
        })
      );
      const { error: pErr } = await db.from("purchase_receipts").update({ photo_paths: paths }).eq("id", receiptId);
      if (pErr) throw new Error(`No se pudieron guardar las fotos: ${pErr.message}`);
    }

    const { data: insertedLines, error: linesErr } = await db
      .from("purchase_receipt_lines")
      .insert(
        input.lines.map((l) => ({
          receipt_id: receiptId,
          supplier_code: l.supplierCode,
          ticket_description: l.ticketDescription,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          lot: l.lot,
          expires_on: l.expiresOn,
          barcode: l.barcode,
          description: l.description,
          sale_price: l.salePrice,
          pack_factor: l.packFactor,
        }))
      )
      .select("id");
    if (linesErr) throw new Error(`No se pudieron guardar los renglones: ${linesErr.message}`);

    const resolvedIdx: number[] = [];
    const equivalences: Record<string, unknown>[] = [];
    for (let i = 0; i < input.lines.length; i++) {
      const l = input.lines[i];
      if (!isResolved(l)) continue;
      resolvedIdx.push(i);
      if (l.supplierCode) {
        equivalences.push({
          supplier_id: input.supplierId,
          supplier_code: l.supplierCode,
          supplier_description: l.ticketDescription,
          barcode: l.barcode,
          description: l.description,
          sale_price: l.salePrice,
          pack_factor: l.packFactor,
          last_unit_price: l.unitPrice,
        });
      }
    }

    if (resolvedIdx.length > 0) {
      const { data: insertedPurchases, error: purchErr } = await db
        .from("purchases")
        .insert(
          resolvedIdx.map((i) => {
            const l = input.lines[i];
            return {
              purchase_date: input.ticketDate,
              supplier_id: input.supplierId,
              short_code: null,
              barcode: l.barcode,
              description: l.description,
              quantity: Math.round(l.quantity * l.packFactor * 1000) / 1000,
              cost: Math.round((l.unitPrice / l.packFactor) * 10000) / 10000,
              price: l.salePrice,
              invoice: null,
              lot: l.lot,
              expires_on: l.expiresOn,
              pack_factor: l.packFactor,
              supplier_code: l.supplierCode,
              receipt_id: receiptId,
              created_by: input.createdBy,
            };
          })
        )
        .select("id");
      if (purchErr) throw new Error(`No se pudieron guardar los movimientos: ${purchErr.message}`);

      // Postgres exige que las columnas NOT NULL tengan valor en la fila
      // propuesta incluso cuando el upsert termina en la rama DO UPDATE — no
      // basta con mandar {id, purchase_id}, hay que reenviar la fila
      // completa (con los mismos valores ya insertados) o truena con "null
      // value in column ... violates not-null constraint".
      const linkRows = resolvedIdx.map((lineIdx, k) => {
        const l = input.lines[lineIdx];
        return {
          id: insertedLines[lineIdx].id,
          receipt_id: receiptId,
          supplier_code: l.supplierCode,
          ticket_description: l.ticketDescription,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          lot: l.lot,
          expires_on: l.expiresOn,
          barcode: l.barcode,
          description: l.description,
          sale_price: l.salePrice,
          pack_factor: l.packFactor,
          purchase_id: insertedPurchases[k].id,
        };
      });
      const { error: linkErr } = await db.from("purchase_receipt_lines").upsert(linkRows, { onConflict: "id" });
      if (linkErr) throw new Error(`No se pudo ligar los renglones a sus movimientos: ${linkErr.message}`);
    }

    if (equivalences.length > 0) {
      const now = new Date().toISOString();
      const { error: eqErr } = await db
        .from("supplier_products")
        .upsert(
          equivalences.map((e) => ({ ...e, last_seen_at: now, updated_at: now })),
          { onConflict: "supplier_id,supplier_code" }
        );
      if (eqErr) throw new Error(`No se pudieron guardar las equivalencias: ${eqErr.message}`);
    }

    // Si algún código de barras que llegó en este ticket coincide con un
    // negado/faltante pendiente, se marca como surtido solo — nunca por
    // descripción parecida, solo por código exacto. No es fatal: si falla,
    // la recepción ya se guardó bien de todas formas.
    const resolvedBarcodes = [...new Set(resolvedIdx.map((i) => input.lines[i].barcode.trim()).filter(Boolean))];
    if (resolvedBarcodes.length > 0) {
      const { error: stockoutErr } = await db
        .from("stockout_reports")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .in("barcode", resolvedBarcodes)
        .eq("resolved", false);
      if (stockoutErr) console.error("[stockout_reports]", stockoutErr.message);
    }

    const totalPieces = input.lines.reduce((sum, l) => sum + l.quantity * l.packFactor, 0);
    const { error: histErr } = await db
      .from("history")
      .insert({ user_id: input.createdBy, action: "Recibió mercancía", detail: `Ticket ${input.ticketNumber || "s/n"} · ${input.lines.length} renglones · ${totalPieces} piezas` });
    if (histErr) console.error("[history]", histErr.message);

    return json({ id: receiptId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("save-receipt failed:", message);
    return json({ error: message }, 500);
  }
});
