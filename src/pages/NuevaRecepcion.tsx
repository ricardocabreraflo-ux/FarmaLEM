import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { navigate } from "../App";
import { compressToBase64 } from "../lib/images";
import {
  buildDraftLines, emptyLine, fetchSupplierCatalog, fetchSuppliers, findProductByBarcode, parseTicketPhotos, saveReceipt, searchProducts,
} from "../lib/receipts";
import { money, round2, type DraftLine, type ParsedTicket, type Product, type Supplier, type SupplierProduct } from "../lib/types";

type Photo = { base64: string; blob: Blob; previewUrl: string };
type Step = "fotos" | "leyendo" | "captura" | "guardando";

const today = () => new Date().toISOString().slice(0, 10);

export default function NuevaRecepcion() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [catalog, setCatalog] = useState<Map<string, SupplierProduct>>(new Map());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [step, setStep] = useState<Step>("fotos");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTicket | null>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticketDate, setTicketDate] = useState(today());
  const [ticketTotal, setTicketTotal] = useState<string>("");
  const [ticketPieces, setTicketPieces] = useState<string>("");
  const [ticketSavings, setTicketSavings] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSuppliers().then((s) => { setSuppliers(s); if (s.length && !supplierId) setSupplierId(s[0].id); }).catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    fetchSupplierCatalog(supplierId).then(setCatalog).catch((e: Error) => setError(e.message));
  }, [supplierId]);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    try {
      const out: Photo[] = [];
      for (const f of files) out.push(await compressToBase64(f));
      setPhotos((p) => [...p, ...out].slice(0, 8));
    } catch (err) { setError((err as Error).message); }
  }

  async function leerTicket() {
    setError(null); setStep("leyendo");
    try {
      const ticket = await parseTicketPhotos(photos.map((p) => ({ media_type: "image/jpeg", data: p.base64 })));
      setParsed(ticket);
      if (ticket.ticket_numero) setTicketNumber(ticket.ticket_numero);
      if (ticket.fecha) setTicketDate(ticket.fecha);
      if (ticket.importe != null) setTicketTotal(String(ticket.importe));
      if (ticket.piezas != null) setTicketPieces(String(ticket.piezas));
      if (ticket.ahorro != null) setTicketSavings(String(ticket.ahorro));
      setLines(buildDraftLines(ticket.lineas, catalog));
      setStep("captura");
    } catch (err) {
      setError(`No se pudo leer el ticket: ${(err as Error).message}`);
      setStep("fotos");
    }
  }

  function capturaManual() { setLines([emptyLine()]); setStep("captura"); }

  function update(key: string, patch: Partial<DraftLine>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  /** Al cambiar la clave del proveedor, intenta cruzar de nuevo con el catálogo. */
  function onSupplierCode(l: DraftLine, code: string) {
    const hit = catalog.get(code.trim());
    if (hit?.product) {
      update(l.key, { supplier_code: code, product_id: hit.product.id, barcode: hit.product.barcode, product_name: hit.product.name, sale_price: hit.product.sale_price, pack_factor: hit.pack_factor, match: "catalogo" });
    } else update(l.key, { supplier_code: code });
  }

  async function onBarcodeBlur(l: DraftLine) {
    if (l.match === "catalogo" || !l.barcode.trim()) return;
    try {
      const p = await findProductByBarcode(l.barcode);
      if (p) update(l.key, { product_id: p.id, product_name: p.name, sale_price: p.sale_price, match: "producto" });
      else update(l.key, { product_id: null, match: "nuevo" });
    } catch (err) { setError((err as Error).message); }
  }

  function linkProduct(l: DraftLine, p: Product) {
    update(l.key, { product_id: p.id, barcode: p.barcode, product_name: p.name, sale_price: p.sale_price, match: "producto" });
  }

  const totals = useMemo(() => {
    const suma = round2(lines.reduce((a, l) => a + l.quantity * l.unit_price, 0));
    const unidades = lines.reduce((a, l) => a + l.quantity, 0);
    const piezas = lines.reduce((a, l) => a + l.quantity * l.pack_factor, 0);
    const importe = ticketTotal ? Number(ticketTotal) : null;
    const piezasTicket = ticketPieces ? Number(ticketPieces) : null;
    return { suma, unidades, piezas, importe, diff: importe != null ? round2(suma - importe) : null, diffPz: piezasTicket != null ? unidades - piezasTicket : null };
  }, [lines, ticketTotal, ticketPieces]);

  const pendientes = lines.filter((l) => !l.barcode.trim() || !l.product_name.trim() || l.sale_price == null || l.quantity <= 0);

  async function guardar() {
    setError(null);
    if (!supplierId) return setError("Selecciona el proveedor");
    if (!lines.length) return setError("No hay renglones que guardar");
    if (pendientes.length) return setError(`Faltan datos en ${pendientes.length} renglón(es): código de barras, descripción o precio de venta.`);
    if (totals.diff != null && Math.abs(totals.diff) > 1 && !confirm(`La suma de renglones (${money(totals.suma)}) no cuadra con el importe del ticket (${money(totals.importe)}). ¿Guardar de todos modos?`)) return;
    setStep("guardando");
    try {
      const id = await saveReceipt({
        supplierId, ticketNumber, ticketDate,
        ticketTotal: ticketTotal ? Number(ticketTotal) : null,
        ticketPieces: ticketPieces ? Number(ticketPieces) : null,
        ticketSavings: ticketSavings ? Number(ticketSavings) : null,
        notes, rawExtraction: parsed, photos: photos.map((p) => p.blob), lines,
      });
      navigate(`/recepcion/${id}`);
    } catch (err) {
      setError(`No se pudo guardar: ${(err as Error).message}`);
      setStep("captura");
    }
  }

  return (
    <>
      <h1>Nueva recepción de mercancía</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="card">
        <h2>1 · Proveedor y fotos del ticket</h2>
        <div className="row">
          <div className="field">
            <label>Proveedor</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} disabled={step !== "fotos"}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <span className="muted">{catalog.size} productos conocidos de este proveedor</span>
        </div>
        {step === "fotos" && (
          <>
            <div className="dropzone" style={{ marginTop: 12 }} onClick={() => fileInput.current?.click()}>
              <input ref={fileInput} type="file" accept="image/*" multiple onChange={onFiles} />
              Toma o sube las fotos del ticket (de arriba hacia abajo). Puedes subir varias; se aceptan hasta 8.
            </div>
            {photos.length > 0 && (
              <div className="photos" style={{ marginTop: 12 }}>
                {photos.map((p, i) => (
                  <div className="photo" key={i}>
                    <img src={p.previewUrl} alt={`Foto ${i + 1}`} />
                    <button className="btn small" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={!photos.length || !supplierId} onClick={leerTicket}>Leer ticket</button>
              <button className="btn" onClick={capturaManual}>Capturar a mano sin fotos</button>
            </div>
          </>
        )}
        {step === "leyendo" && <div className="alert info" style={{ marginTop: 12 }}>Leyendo el ticket… esto tarda entre 30 segundos y un minuto según el número de fotos.</div>}
        {(step === "captura" || step === "guardando") && photos.length > 0 && (
          <div className="photos" style={{ marginTop: 12 }}>{photos.map((p, i) => <a key={i} href={p.previewUrl} target="_blank" rel="noreferrer"><img src={p.previewUrl} alt={`Foto ${i + 1}`} /></a>)}</div>
        )}
      </div>

      {(step === "captura" || step === "guardando") && (
        <>
          <div className="card">
            <h2>2 · Datos del ticket</h2>
            {parsed?.observaciones && <div className="alert warn">Observaciones de la lectura: {parsed.observaciones}</div>}
            <div className="row">
              <div className="field"><label>No. de ticket</label><input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} /></div>
              <div className="field"><label>Fecha</label><input type="date" value={ticketDate} onChange={(e) => setTicketDate(e.target.value)} /></div>
              <div className="field"><label>Importe del ticket</label><input type="number" step="0.01" value={ticketTotal} onChange={(e) => setTicketTotal(e.target.value)} /></div>
              <div className="field"><label>Piezas (ticket)</label><input type="number" value={ticketPieces} onChange={(e) => setTicketPieces(e.target.value)} /></div>
              <div className="field"><label>Ahorro</label><input type="number" step="0.01" value={ticketSavings} onChange={(e) => setTicketSavings(e.target.value)} /></div>
              <div className="field" style={{ flex: 1 }}><label>Notas</label><input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
          </div>

          <div className="card">
            <h2>3 · Renglones</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              <span className="tag catalogo">catálogo</span> se llenó solo con la equivalencia del proveedor ·{" "}
              <span className="tag producto">producto</span> se ligó a un producto ya existente ·{" "}
              <span className="tag nuevo">nuevo</span> captura código de barras, descripción y precio una sola vez ·{" "}
              <span className="tag baja">lectura dudosa</span> revisa contra la foto.
            </p>
            <div className="tablewrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>#</th><th>Estado</th><th>Clave prov.</th><th>Descripción ticket</th><th className="num">Cant.</th><th className="num">Precio</th><th className="num">Total</th>
                    <th>Lote</th><th>Caducidad</th><th>Código de barras</th><th>Producto FarmaLEM</th><th className="num">Factor</th><th className="num">Piezas</th><th className="num">Costo/pza</th><th className="num">Precio venta</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => (
                    <LineRow key={l.key} idx={idx} l={l} update={update} onSupplierCode={onSupplierCode} onBarcodeBlur={onBarcodeBlur} linkProduct={linkProduct}
                      remove={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions" style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => setLines((ls) => [...ls, emptyLine()])}>+ Agregar renglón</button>
            </div>
          </div>

          <div className="card">
            <h2>4 · Verificación</h2>
            <div className="totals">
              <div className="kpi"><div className="label">Renglones</div><div className="value">{lines.length}</div></div>
              <div className="kpi"><div className="label">Suma renglones</div><div className="value">{money(totals.suma)}</div></div>
              <div className={`kpi ${totals.diff == null ? "" : Math.abs(totals.diff) <= 1 ? "ok" : "bad"}`}><div className="label">Diferencia vs. ticket</div><div className="value">{totals.diff == null ? "—" : money(totals.diff)}</div></div>
              <div className={`kpi ${totals.diffPz == null ? "" : totals.diffPz === 0 ? "ok" : "bad"}`}><div className="label">Unidades vs. ticket</div><div className="value">{totals.unidades}{totals.diffPz != null && ` (${totals.diffPz >= 0 ? "+" : ""}${totals.diffPz})`}</div></div>
              <div className="kpi"><div className="label">Piezas FarmaLEM</div><div className="value">{totals.piezas}</div></div>
              <div className={`kpi ${pendientes.length ? "bad" : "ok"}`}><div className="label">Renglones incompletos</div><div className="value">{pendientes.length}</div></div>
            </div>
            <div className="actions" style={{ marginTop: 14 }}>
              <button className="btn primary" disabled={step === "guardando"} onClick={guardar}>{step === "guardando" ? "Guardando…" : "Guardar y confirmar recepción"}</button>
              <button className="btn" disabled={step === "guardando"} onClick={() => { setStep("fotos"); setLines([]); setParsed(null); }}>Volver a las fotos</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

type RowProps = {
  idx: number; l: DraftLine;
  update: (key: string, patch: Partial<DraftLine>) => void;
  onSupplierCode: (l: DraftLine, code: string) => void;
  onBarcodeBlur: (l: DraftLine) => void;
  linkProduct: (l: DraftLine, p: Product) => void;
  remove: () => void;
};

function LineRow({ idx, l, update, onSupplierCode, onBarcodeBlur, linkProduct, remove }: RowProps) {
  const [suggest, setSuggest] = useState<Product[]>([]);
  const num = (v: string) => (v === "" ? 0 : Number(v));

  async function onNameChange(v: string) {
    update(l.key, { product_name: v, ...(l.match !== "nuevo" ? { product_id: null, match: "nuevo" as const } : {}) });
    if (l.match === "nuevo" && v.trim().length >= 3) {
      try { setSuggest(await searchProducts(v)); } catch { setSuggest([]); }
    } else setSuggest([]);
  }

  return (
    <tr className={`${l.match} ${l.confianza === "baja" ? "baja" : ""}`}>
      <td>{idx + 1}</td>
      <td><span className={`tag ${l.match}`}>{l.match}</span>{l.confianza === "baja" && <> <span className="tag baja">?</span></>}</td>
      <td><input className="w-sm" value={l.supplier_code} onChange={(e) => onSupplierCode(l, e.target.value)} /></td>
      <td><input className="w-lg" value={l.ticket_description} onChange={(e) => update(l.key, { ticket_description: e.target.value })} /></td>
      <td className="num"><input className="w-sm" type="number" step="1" min="0" value={l.quantity} onChange={(e) => update(l.key, { quantity: num(e.target.value) })} /></td>
      <td className="num"><input className="w-sm" type="number" step="0.01" min="0" value={l.unit_price} onChange={(e) => update(l.key, { unit_price: num(e.target.value) })} /></td>
      <td className="num">{money(round2(l.quantity * l.unit_price))}</td>
      <td><input className="w-md" value={l.lot} onChange={(e) => update(l.key, { lot: e.target.value })} /></td>
      <td><input type="date" value={l.expires_on} onChange={(e) => update(l.key, { expires_on: e.target.value })} /></td>
      <td><input className="w-md" value={l.barcode} readOnly={l.match === "catalogo"} onChange={(e) => update(l.key, { barcode: e.target.value })} onBlur={() => onBarcodeBlur(l)} placeholder="EAN" /></td>
      <td className="rel">
        <input className="w-lg" value={l.product_name} readOnly={l.match !== "nuevo"} onChange={(e) => onNameChange(e.target.value)} onBlur={() => setTimeout(() => setSuggest([]), 150)} placeholder="Descripción FarmaLEM" />
        {suggest.length > 0 && (
          <div className="suggest">
            {suggest.map((p) => <div key={p.id} onMouseDown={() => { linkProduct(l, p); setSuggest([]); }}>{p.name} <span className="muted">· {p.barcode} · {money(p.sale_price)}</span></div>)}
          </div>
        )}
      </td>
      <td className="num"><input className="w-sm" type="number" min="1" step="1" value={l.pack_factor} onChange={(e) => update(l.key, { pack_factor: Math.max(1, Math.round(num(e.target.value))) })} /></td>
      <td className="num">{l.quantity * l.pack_factor}</td>
      <td className="num">{money(l.pack_factor ? l.unit_price / l.pack_factor : 0)}</td>
      <td className="num"><input className="w-sm" type="number" step="0.01" min="0" value={l.sale_price ?? ""} onChange={(e) => update(l.key, { sale_price: e.target.value === "" ? null : Number(e.target.value) })} /></td>
      <td><button className="btn small danger" onClick={remove} title="Quitar renglón">✕</button></td>
    </tr>
  );
}
