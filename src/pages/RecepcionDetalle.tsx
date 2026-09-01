import { useEffect, useState } from "react";
import { fetchReceipt, photoUrls } from "../lib/receipts";
import { exportFarmaLEM, exportSicarX } from "../lib/excel";
import { money, type Receipt, type ReceiptItem } from "../lib/types";

const fmt = (iso: string | null) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };

export default function RecepcionDetalle({ id }: { id: string }) {
  const [data, setData] = useState<{ receipt: Receipt; items: ReceiptItem[] } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipt(id)
      .then(async (d) => { setData(d); setPhotos(await photoUrls(d.receipt.photo_paths)); })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="muted">Cargando…</div>;
  const { receipt, items } = data;
  const suma = items.reduce((a, i) => a + Number(i.line_total), 0);
  const piezas = items.reduce((a, i) => a + Number(i.pieces), 0);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>{receipt.supplier?.name} · Ticket {receipt.ticket_number ?? "s/n"} · {fmt(receipt.ticket_date)}</h1>
        <div className="actions">
          <button className="btn" onClick={() => exportFarmaLEM(receipt, items)}>⬇ Excel FarmaLEM</button>
          <button className="btn" onClick={() => exportSicarX(receipt, items)}>⬇ Excel SICAR X (inventario inicial)</button>
        </div>
      </div>
      <div className="card totals">
        <div className="kpi"><div className="label">Renglones</div><div className="value">{items.length}</div></div>
        <div className="kpi"><div className="label">Piezas FarmaLEM</div><div className="value">{piezas}</div></div>
        <div className="kpi"><div className="label">Suma renglones</div><div className="value">{money(suma)}</div></div>
        <div className="kpi"><div className="label">Importe ticket</div><div className="value">{money(receipt.ticket_total)}</div></div>
        <div className="kpi"><div className="label">Estado</div><div className="value">{receipt.status}</div></div>
      </div>
      {photos.length > 0 && (
        <div className="card">
          <h2>Fotos del ticket</h2>
          <div className="photos">{photos.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt={`Foto ${i + 1}`} /></a>)}</div>
        </div>
      )}
      <div className="card tablewrap">
        <table className="grid">
          <thead>
            <tr><th>#</th><th>Clave prov.</th><th>Código de barras</th><th>Producto FarmaLEM</th><th className="num">Cant. ticket</th><th className="num">Factor</th><th className="num">Piezas</th><th className="num">Costo pieza</th><th className="num">Total</th><th className="num">Precio venta</th><th>Lote</th><th>Caducidad</th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.line_no}</td><td>{i.supplier_code}</td><td>{i.product?.barcode}</td><td style={{ whiteSpace: "normal" }}>{i.product?.name ?? i.ticket_description}</td>
                <td className="num">{Number(i.quantity)}</td><td className="num">{i.pack_factor}</td><td className="num">{Number(i.pieces)}</td>
                <td className="num">{money(Number(i.unit_cost))}</td><td className="num">{money(Number(i.line_total))}</td><td className="num">{money(i.sale_price)}</td>
                <td>{i.lot}</td><td>{fmt(i.expires_on)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
