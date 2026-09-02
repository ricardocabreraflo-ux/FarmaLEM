"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { compressToBase64 } from "@/lib/client-image";
import { fetchSupplierCatalogAction, findByBarcodeAction, parseTicketPhotosAction, saveReceiptAction } from "@/app/admin/compras/actions";
import type { ParsedLine, ParsedTicket } from "@/lib/ticket-parser";
import type { SupplierProduct } from "@/lib/supplier-products";
import type { Supplier } from "@/lib/suppliers";

type Photo = { file: File; base64: string; previewUrl: string };
type Step = "fotos" | "leyendo" | "captura" | "guardando";
type Match = "catalogo" | "producto" | "nuevo";
type Confidence = "alta" | "media" | "baja";

interface DraftLine {
  key: string;
  supplierCode: string;
  ticketDescription: string;
  quantity: number;
  unitPrice: number;
  lot: string;
  expiresOn: string;
  confidence: Confidence;
  barcode: string;
  description: string;
  salePrice: number | null;
  packFactor: number;
  match: Match;
}

let keySeq = 0;
const newKey = () => `l${Date.now()}-${keySeq++}`;

function money(n: number | null | undefined) {
  return n == null ? "" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine(): DraftLine {
  return {
    key: newKey(),
    supplierCode: "",
    ticketDescription: "",
    quantity: 1,
    unitPrice: 0,
    lot: "",
    expiresOn: "",
    confidence: "alta",
    barcode: "",
    description: "",
    salePrice: null,
    packFactor: 1,
    match: "nuevo",
  };
}

function buildDraftLines(lines: ParsedLine[], catalog: Map<string, SupplierProduct>): DraftLine[] {
  return lines.map((l) => {
    const base: DraftLine = {
      key: newKey(),
      supplierCode: l.clave ?? "",
      ticketDescription: l.descripcion,
      quantity: l.cantidad,
      unitPrice: l.precio_unitario,
      lot: l.lote ?? "",
      expiresOn: l.caducidad ?? "",
      confidence: l.confianza,
      barcode: "",
      description: "",
      salePrice: null,
      packFactor: 1,
      match: "nuevo",
    };
    const hit = l.clave ? catalog.get(l.clave) : undefined;
    if (hit) {
      return { ...base, barcode: hit.barcode, description: hit.description, salePrice: hit.sale_price, packFactor: hit.pack_factor, match: "catalogo" };
    }
    return base;
  });
}

const inputClass =
  "w-full rounded-lg border border-admin-border bg-admin-input-bg px-2.5 py-1.5 text-[0.84rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-primary";

const MATCH_LABEL: Record<Match, string> = { catalogo: "catálogo", producto: "producto", nuevo: "nuevo" };
const MATCH_CLASS: Record<Match, string> = {
  catalogo: "bg-admin-ok-bg text-admin-ok-text",
  producto: "bg-admin-primary-soft text-admin-primary-deep",
  nuevo: "bg-admin-pending-bg text-admin-pending-text",
};

export function ReceiptCaptureFlow({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [catalog, setCatalog] = useState<Map<string, SupplierProduct>>(new Map());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [step, setStep] = useState<Step>("fotos");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTicket | null>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticketDate, setTicketDate] = useState(today());
  const [ticketTotal, setTicketTotal] = useState("");
  const [ticketPieces, setTicketPieces] = useState("");
  const [ticketSavings, setTicketSavings] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supplierId) return;
    fetchSupplierCatalogAction(supplierId)
      .then((rows) => setCatalog(new Map(rows.map((r) => [r.supplier_code, r]))))
      .catch((e: Error) => setError(e.message));
  }, [supplierId]);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    try {
      const out: Photo[] = [];
      for (const f of files) out.push(await compressToBase64(f));
      setPhotos((p) => [...p, ...out].slice(0, 8));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function leerTicket() {
    setError(null);
    setStep("leyendo");
    const res = await parseTicketPhotosAction(photos.map((p) => ({ mediaType: "image/jpeg", data: p.base64 })));
    if (!res.ok || !res.ticket) {
      setError(`No se pudo leer el ticket: ${res.error ?? "error desconocido"}`);
      setStep("fotos");
      return;
    }
    const ticket = res.ticket;
    setParsed(ticket);
    if (ticket.ticket_numero) setTicketNumber(ticket.ticket_numero);
    if (ticket.fecha) setTicketDate(ticket.fecha);
    if (ticket.importe != null) setTicketTotal(String(ticket.importe));
    if (ticket.piezas != null) setTicketPieces(String(ticket.piezas));
    if (ticket.ahorro != null) setTicketSavings(String(ticket.ahorro));
    setLines(buildDraftLines(ticket.lineas, catalog));
    setStep("captura");
  }

  function capturaManual() {
    setLines([emptyLine()]);
    setStep("captura");
  }

  function update(key: string, patch: Partial<DraftLine>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function onSupplierCode(l: DraftLine, code: string) {
    const hit = catalog.get(code.trim());
    if (hit) {
      update(l.key, { supplierCode: code, barcode: hit.barcode, description: hit.description, salePrice: hit.sale_price, packFactor: hit.pack_factor, match: "catalogo" });
    } else {
      update(l.key, { supplierCode: code, match: l.match === "catalogo" ? "nuevo" : l.match });
    }
  }

  async function onBarcodeBlur(l: DraftLine) {
    if (l.match === "catalogo" || !l.barcode.trim()) return;
    try {
      const known = await findByBarcodeAction(l.barcode.trim());
      if (known) update(l.key, { barcode: known.barcode, description: known.description, salePrice: known.salePrice, match: "producto" });
      else update(l.key, { match: "nuevo" });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const totals = useMemo(() => {
    const suma = round2(lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0));
    const unidades = lines.reduce((a, l) => a + l.quantity, 0);
    const piezas = lines.reduce((a, l) => a + l.quantity * l.packFactor, 0);
    const importe = ticketTotal ? Number(ticketTotal) : null;
    const piezasTicket = ticketPieces ? Number(ticketPieces) : null;
    return { suma, unidades, piezas, importe, diff: importe != null ? round2(suma - importe) : null, diffPz: piezasTicket != null ? unidades - piezasTicket : null };
  }, [lines, ticketTotal, ticketPieces]);

  const pendientes = lines.filter((l) => !l.barcode.trim() || !l.description.trim() || l.salePrice == null || l.quantity <= 0);

  async function guardar() {
    setError(null);
    if (!supplierId) return setError("Selecciona el proveedor.");
    if (!lines.length) return setError("No hay renglones que guardar.");
    if (pendientes.length) return setError(`Faltan datos en ${pendientes.length} renglón(es): código de barras, descripción o precio de venta.`);
    if (totals.diff != null && Math.abs(totals.diff) > 1) {
      const ok = window.confirm(`La suma de renglones (${money(totals.suma)}) no cuadra con el importe del ticket (${money(totals.importe)}). ¿Guardar de todos modos?`);
      if (!ok) return;
    }
    setStep("guardando");

    const fd = new FormData();
    fd.set("supplierId", supplierId);
    fd.set("ticketNumber", ticketNumber);
    fd.set("ticketDate", ticketDate);
    fd.set("ticketTotal", ticketTotal);
    fd.set("ticketPieces", ticketPieces);
    fd.set("ticketSavings", ticketSavings);
    fd.set("notes", notes);
    fd.set("rawExtraction", parsed ? JSON.stringify(parsed) : "");
    fd.set(
      "lines",
      JSON.stringify(
        lines.map((l) => ({
          supplierCode: l.supplierCode.trim() || null,
          ticketDescription: l.ticketDescription.trim() || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lot: l.lot.trim() || null,
          expiresOn: l.expiresOn || null,
          barcode: l.barcode.trim(),
          description: l.description.trim(),
          salePrice: l.salePrice,
          packFactor: l.packFactor,
        }))
      )
    );
    photos.forEach((p, i) => fd.append("photo", p.file, `foto-${i + 1}.jpg`));

    const res = await saveReceiptAction(fd);
    if (res.ok && res.id) {
      router.push(`/admin/compras/${res.id}`);
    } else {
      setError(`No se pudo guardar: ${res.error ?? "error desconocido"}`);
      setStep("captura");
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      {error && <p className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">{error}</p>}

      <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
        <h2 className="font-display text-base text-admin-ink">1 · Proveedor y fotos del ticket</h2>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="block text-[0.85rem] font-semibold text-admin-ink">
            Proveedor
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={step !== "fotos"} className={`${inputClass} mt-1.5 w-[220px]`}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <span className="text-[0.82rem] text-admin-ink-soft">{catalog.size} productos conocidos de este proveedor</span>
        </div>

        {step === "fotos" && (
          <>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-admin-border px-6 py-8 text-center text-[0.85rem] text-admin-ink-soft hover:border-admin-primary hover:text-admin-primary-deep"
            >
              <input ref={fileInput} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
              Toma o sube las fotos del ticket (de arriba hacia abajo). Puedes subir varias; se aceptan hasta 8.
            </button>
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-admin-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-admin-bad-bg text-[0.7rem] font-bold text-admin-bad-text"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!photos.length || !supplierId}
                onClick={leerTicket}
                className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white disabled:opacity-50"
              >
                Leer ticket
              </button>
              <button type="button" onClick={capturaManual} className="rounded-full border border-admin-border px-6 py-2.5 text-[0.86rem] font-semibold text-admin-ink">
                Capturar a mano sin fotos
              </button>
            </div>
          </>
        )}
        {step === "leyendo" && (
          <p className="mt-4 rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
            Leyendo el ticket… esto tarda entre 30 segundos y un minuto según el número de fotos.
          </p>
        )}
        {(step === "captura" || step === "guardando") && photos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <a key={i} href={p.previewUrl} target="_blank" rel="noreferrer" className="h-20 w-20 overflow-hidden rounded-lg border border-admin-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}
      </section>

      {(step === "captura" || step === "guardando") && (
        <>
          <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
            <h2 className="font-display text-base text-admin-ink">2 · Datos del ticket</h2>
            {parsed?.observaciones && (
              <p className="mt-2 rounded-lg bg-admin-pending-bg px-4 py-2.5 text-[0.82rem] text-admin-pending-text">Observaciones de la lectura: {parsed.observaciones}</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <label className="block text-[0.8rem] font-semibold text-admin-ink">
                No. de ticket
                <input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="block text-[0.8rem] font-semibold text-admin-ink">
                Fecha
                <input type="date" value={ticketDate} onChange={(e) => setTicketDate(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="block text-[0.8rem] font-semibold text-admin-ink">
                Importe del ticket
                <input type="number" step="0.01" value={ticketTotal} onChange={(e) => setTicketTotal(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="block text-[0.8rem] font-semibold text-admin-ink">
                Piezas (ticket)
                <input type="number" value={ticketPieces} onChange={(e) => setTicketPieces(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="block text-[0.8rem] font-semibold text-admin-ink">
                Ahorro
                <input type="number" step="0.01" value={ticketSavings} onChange={(e) => setTicketSavings(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="block text-[0.8rem] font-semibold text-admin-ink">
                Notas
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
            <h2 className="font-display text-base text-admin-ink">3 · Renglones</h2>
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-admin-ink-soft">
              <span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${MATCH_CLASS.catalogo}`}>catálogo</span> se llenó solo con la equivalencia del proveedor
              </span>
              <span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${MATCH_CLASS.producto}`}>producto</span> se ligó a un producto ya recibido antes
              </span>
              <span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${MATCH_CLASS.nuevo}`}>nuevo</span> captura código de barras, descripción y precio una sola vez
              </span>
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1400px] text-left text-[0.84rem]">
                <thead>
                  <tr className="border-b border-admin-border text-admin-ink-soft">
                    <th className="px-2 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">Estado</th>
                    <th className="px-2 py-2 font-medium">Clave prov.</th>
                    <th className="px-2 py-2 font-medium">Descripción ticket</th>
                    <th className="px-2 py-2 text-right font-medium">Cant.</th>
                    <th className="px-2 py-2 text-right font-medium">Precio</th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                    <th className="px-2 py-2 font-medium">Lote</th>
                    <th className="px-2 py-2 font-medium">Caducidad</th>
                    <th className="px-2 py-2 font-medium">Código de barras</th>
                    <th className="px-2 py-2 font-medium">Producto FarmaLEM</th>
                    <th className="px-2 py-2 text-right font-medium">Factor</th>
                    <th className="px-2 py-2 text-right font-medium">Piezas</th>
                    <th className="px-2 py-2 text-right font-medium">Costo/pza</th>
                    <th className="px-2 py-2 text-right font-medium">Precio venta</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => (
                    <tr key={l.key} className="border-b border-admin-border last:border-0">
                      <td className="px-2 py-1.5 text-admin-ink-soft">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[0.74rem] font-semibold ${MATCH_CLASS[l.match]}`}>{MATCH_LABEL[l.match]}</span>
                        {l.confidence === "baja" && (
                          <span className="ml-1 rounded-full bg-admin-bad-bg px-1.5 py-0.5 text-[0.7rem] font-bold text-admin-bad-text" title="Lectura dudosa: revisa contra la foto">
                            ?
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={`${inputClass} w-[90px]`} value={l.supplierCode} onChange={(e) => onSupplierCode(l, e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={`${inputClass} w-[220px]`} value={l.ticketDescription} onChange={(e) => update(l.key, { ticketDescription: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={`${inputClass} w-[70px] text-right`}
                          type="number"
                          step="1"
                          min="0"
                          value={l.quantity}
                          onChange={(e) => update(l.key, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={`${inputClass} w-[90px] text-right`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={l.unitPrice}
                          onChange={(e) => update(l.key, { unitPrice: e.target.value === "" ? 0 : Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-data tabular-nums text-admin-ink">{money(round2(l.quantity * l.unitPrice))}</td>
                      <td className="px-2 py-1.5">
                        <input className={`${inputClass} w-[90px]`} value={l.lot} onChange={(e) => update(l.key, { lot: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="date" className={`${inputClass} w-[140px]`} value={l.expiresOn} onChange={(e) => update(l.key, { expiresOn: e.target.value })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={`${inputClass} w-[130px]`}
                          value={l.barcode}
                          readOnly={l.match === "catalogo"}
                          onChange={(e) => update(l.key, { barcode: e.target.value })}
                          onBlur={() => onBarcodeBlur(l)}
                          placeholder="EAN"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={`${inputClass} w-[220px]`}
                          value={l.description}
                          readOnly={l.match !== "nuevo"}
                          onChange={(e) => update(l.key, { description: e.target.value })}
                          placeholder="Descripción FarmaLEM"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className={`${inputClass} w-[60px] text-right`}
                          type="number"
                          min="1"
                          step="1"
                          value={l.packFactor}
                          onChange={(e) => update(l.key, { packFactor: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-data tabular-nums text-admin-ink">{l.quantity * l.packFactor}</td>
                      <td className="px-2 py-1.5 text-right font-data tabular-nums text-admin-ink-soft">{money(l.packFactor ? l.unitPrice / l.packFactor : 0)}</td>
                      <td className="px-2 py-1.5">
                        <input
                          className={`${inputClass} w-[90px] text-right`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={l.salePrice ?? ""}
                          onChange={(e) => update(l.key, { salePrice: e.target.value === "" ? null : Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="font-semibold text-admin-ink-soft hover:text-admin-bad-text">
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setLines((ls) => [...ls, emptyLine()])} className="mt-3 text-[0.85rem] font-semibold text-admin-primary hover:underline">
              + Agregar renglón
            </button>
          </section>

          <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
            <h2 className="font-display text-base text-admin-ink">4 · Verificación</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Renglones" value={String(lines.length)} />
              <Stat label="Suma renglones" value={money(totals.suma)} />
              <Stat
                label="Diferencia vs. ticket"
                value={totals.diff == null ? "—" : money(totals.diff)}
                tone={totals.diff == null ? "neutral" : Math.abs(totals.diff) <= 1 ? "ok" : "bad"}
              />
              <Stat
                label="Unidades vs. ticket"
                value={totals.diffPz == null ? String(totals.unidades) : `${totals.unidades} (${totals.diffPz >= 0 ? "+" : ""}${totals.diffPz})`}
                tone={totals.diffPz == null ? "neutral" : totals.diffPz === 0 ? "ok" : "bad"}
              />
              <Stat label="Piezas FarmaLEM" value={String(totals.piezas)} />
              <Stat label="Renglones incompletos" value={String(pendientes.length)} tone={pendientes.length ? "bad" : "ok"} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={step === "guardando"}
                onClick={guardar}
                className="rounded-full bg-admin-primary px-6 py-3 text-[0.9rem] font-semibold text-white disabled:opacity-60"
              >
                {step === "guardando" ? "Guardando…" : "Guardar y confirmar recepción"}
              </button>
              <button
                type="button"
                disabled={step === "guardando"}
                onClick={() => {
                  setStep("fotos");
                  setLines([]);
                  setParsed(null);
                }}
                className="rounded-full border border-admin-border px-6 py-3 text-[0.9rem] font-semibold text-admin-ink disabled:opacity-60"
              >
                Volver a las fotos
              </button>
              <Link href="/admin/compras" className="rounded-full border border-admin-border px-6 py-3 text-[0.9rem] font-semibold text-admin-ink-soft">
                Cancelar
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "ok" | "bad" | "neutral" }) {
  const toneClass = tone === "ok" ? "text-admin-ok-text" : tone === "bad" ? "text-admin-bad-text" : "text-admin-ink";
  return (
    <div className="rounded-xl border border-admin-border bg-admin-bg/60 px-3 py-2.5">
      <div className="text-[0.72rem] text-admin-ink-soft">{label}</div>
      <div className={`mt-0.5 font-display text-[1.05rem] font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
