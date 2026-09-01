import { useEffect, useState } from "react";
import { fetchReceipts } from "../lib/receipts";
import { money, type Receipt } from "../lib/types";

const fmt = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };

export default function Recepciones() {
  const [rows, setRows] = useState<Receipt[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts().then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Recepciones de mercancía</h1>
        <a className="btn primary" href="#/nueva">+ Nueva recepción</a>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card tablewrap">
        {rows == null ? <span className="muted">Cargando…</span> : rows.length === 0 ? (
          <span className="muted">Aún no hay recepciones. Crea la primera con las fotos del ticket.</span>
        ) : (
          <table className="grid">
            <thead>
              <tr><th>Fecha</th><th>Proveedor</th><th>Ticket</th><th className="num">Piezas</th><th className="num">Importe</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmt(r.ticket_date)}</td>
                  <td>{r.supplier?.name}</td>
                  <td>{r.ticket_number ?? "—"}</td>
                  <td className="num">{r.ticket_pieces ?? "—"}</td>
                  <td className="num">{money(r.ticket_total)}</td>
                  <td><span className={`tag ${r.status === "confirmada" ? "catalogo" : ""}`}>{r.status}</span></td>
                  <td><a href={`#/recepcion/${r.id}`}>Ver / exportar</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
