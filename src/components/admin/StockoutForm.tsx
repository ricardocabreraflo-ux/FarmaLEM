"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStockoutAction, lookupStockoutProductAction } from "@/app/admin/negados/actions";
import type { StockoutKind, StockoutShift } from "@/lib/stockout-reports";

const inputClass =
  "rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function StockoutForm({ defaultShift, isAdmin }: { defaultShift: StockoutShift; isAdmin: boolean }) {
  const router = useRouter();
  const registrarRef = useRef<HTMLButtonElement>(null);
  const [pending, startTransition] = useTransition();
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [kind, setKind] = useState<StockoutKind>("Faltante");
  const [shift, setShift] = useState<StockoutShift>(defaultShift);
  const [barcode, setBarcode] = useState("");
  const [activeSubstance, setActiveSubstance] = useState("");
  const [category, setCategory] = useState("");
  const [presentation, setPresentation] = useState("");
  const [gramaje, setGramaje] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setBarcode("");
    setActiveSubstance("");
    setCategory("");
    setPresentation("");
    setGramaje("");
    setQuantity("1");
    setSalePrice("");
    setCost("");
    setNotes("");
  }

  async function onLookup() {
    setError(null);
    setNotice(null);
    const clean = barcode.trim();
    if (!clean) return;
    setLooking(true);
    try {
      const res = await lookupStockoutProductAction(clean);
      if (res.ok && res.data) {
        setActiveSubstance(res.data.description);
        if (res.data.salePrice != null) setSalePrice(String(res.data.salePrice));
        if (res.data.cost != null) setCost(String(res.data.cost));
        if (res.data.category) setCategory(res.data.category);
        setNotice("Encontrado — se llenaron los datos conocidos.");
        registrarRef.current?.focus();
      } else {
        setNotice("Ese código no está en compras ni en el catálogo. Captúralo como Negado o llena los datos a mano.");
      }
    } finally {
      setLooking(false);
    }
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await createStockoutAction({
        reportDate: todayISO(),
        shift,
        kind,
        barcode,
        activeSubstance,
        category,
        presentation,
        gramaje,
        quantity: Number(quantity) || 0,
        salePrice,
        cost,
        notes,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      reset();
      setNotice("Guardado.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setKind("Faltante")}
          className={`rounded-full px-4 py-1.5 text-[0.82rem] font-semibold ${kind === "Faltante" ? "bg-admin-primary text-white" : "border border-admin-border text-admin-ink-soft"}`}
        >
          Faltante (ya lo conocemos)
        </button>
        <button
          type="button"
          onClick={() => setKind("Negado")}
          className={`rounded-full px-4 py-1.5 text-[0.82rem] font-semibold ${kind === "Negado" ? "bg-admin-primary text-white" : "border border-admin-border text-admin-ink-soft"}`}
        >
          Negado (no lo manejamos)
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kind === "Faltante" && (
          <div className="flex gap-2 lg:col-span-1">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onLookup();
                }
              }}
              placeholder="Código de barras (escanea aquí)"
              autoFocus
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              disabled={looking || !barcode.trim()}
              onClick={onLookup}
              className="rounded-full border border-admin-border px-4 py-2 text-[0.82rem] font-semibold text-admin-ink disabled:opacity-60"
            >
              {looking ? "Buscando…" : "Buscar"}
            </button>
          </div>
        )}
        <input
          value={activeSubstance}
          onChange={(e) => setActiveSubstance(e.target.value)}
          placeholder="Sustancia activa / nombre del producto"
          className={`${inputClass} lg:col-span-1`}
        />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría (Patente, Suelto, Perfumería…)" list="stockout-categorias" className={inputClass} />
        <datalist id="stockout-categorias">
          <option value="Patente" />
          <option value="Suelto" />
          <option value="Perfumería" />
        </datalist>
        <input value={presentation} onChange={(e) => setPresentation(e.target.value)} placeholder="Presentación (tableta, jarabe…)" className={inputClass} />
        <input value={gramaje} onChange={(e) => setGramaje(e.target.value)} placeholder="Gramaje" className={inputClass} />
        <select value={shift} onChange={(e) => setShift(e.target.value as StockoutShift)} className={inputClass}>
          <option value="Matutino">Turno matutino</option>
          <option value="Vespertino">Turno vespertino</option>
        </select>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Piezas"
          className={inputClass}
        />
        <input
          type="number"
          step="0.01"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="Precio de venta"
          className={inputClass}
        />
        {isAdmin && (
          <input type="number" step="0.0001" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Costo" className={inputClass} />
        )}
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" className={`${inputClass} sm:col-span-2 lg:col-span-3`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          ref={registrarRef}
          type="button"
          disabled={pending || !activeSubstance.trim()}
          onClick={onSubmit}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Registrar"}
        </button>
        {notice && <p className="text-[0.8rem] text-admin-ink-soft">{notice}</p>}
        {error && <p className="text-[0.8rem] text-admin-bad-text">{error}</p>}
      </div>
    </div>
  );
}
