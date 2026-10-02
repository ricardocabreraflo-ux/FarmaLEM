"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShortExpiryItemAction, lookupShortExpiryProductAction } from "@/app/admin/caducidad-corta/actions";

const inputClass =
  "rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary";

const SHELVES = ["ANAQUEL_1", "ANAQUEL_2", "ANAQUEL_3", "ANAQUEL_4", "ANAQUEL_5", "ANAQUEL_6", "ANAQUEL_7", "ANAQUEL_8", "ANAQUEL_9", "ANAQUEL_10", "VIT_ARRIBA", "VIT_ABAJO"];
const DISCOUNTS = ["10", "20", "30", "40", "50"];

export function ShortExpiryForm({ month }: { month: string }) {
  const router = useRouter();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAntibiotic, setIsAntibiotic] = useState(false);

  const [shelf, setShelf] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [physicalPieces, setPhysicalPieces] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [twoForOne, setTwoForOne] = useState(false);
  const [notes, setNotes] = useState("");

  function reset() {
    setBarcode("");
    setDescription("");
    setPhysicalPieces("1");
    setUnitPrice("");
    setExpiresOn("");
    setDiscountPct("");
    setTwoForOne(false);
    setNotes("");
    setIsAntibiotic(false);
  }

  async function onLookup() {
    setError(null);
    setNotice(null);
    const clean = barcode.trim();
    if (!clean) return;
    setLooking(true);
    try {
      const res = await lookupShortExpiryProductAction(clean);
      if (res.ok && res.data) {
        setDescription(res.data.description);
        if (res.data.salePrice != null) setUnitPrice(String(res.data.salePrice));
        const antibiotic = res.data.category?.trim().toUpperCase() === "ANTIBIOTICO";
        setIsAntibiotic(antibiotic);
        if (antibiotic) {
          setDiscountPct("");
          setTwoForOne(false);
        }
        setNotice(antibiotic ? "Es antibiótico — no lleva descuento." : "Encontrado — se llenaron los datos conocidos.");
      } else {
        setIsAntibiotic(false);
        setNotice("Ese código no está en compras ni en el catálogo. Llena la descripción a mano.");
      }
    } finally {
      setLooking(false);
    }
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await createShortExpiryItemAction({
        month,
        shelf,
        barcode,
        description,
        physicalPieces: Number(physicalPieces) || 0,
        unitPrice,
        expiresOn,
        discountPct,
        twoForOne,
        notes,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      reset();
      setNotice("Guardado.");
      router.refresh();
      barcodeRef.current?.focus();
    });
  }

  return (
    <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
      <h2 className="font-display text-[0.95rem] text-admin-ink">Registrar producto próximo a caducar</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input value={shelf} onChange={(e) => setShelf(e.target.value)} placeholder="Anaquel / mueble" list="caducidad-anaqueles" className={inputClass} />
        <datalist id="caducidad-anaqueles">
          {SHELVES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex gap-2 lg:col-span-1">
          <input
            ref={barcodeRef}
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
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción del producto" className={inputClass} />
        <input type="number" min="1" value={physicalPieces} onChange={(e) => setPhysicalPieces(e.target.value)} placeholder="Piezas físicas" className={inputClass} />
        <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Precio" className={inputClass} />
        <label className="block text-[0.78rem] text-admin-ink-soft">
          Fecha de caducidad
          <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} className={`${inputClass} mt-1 w-full`} />
        </label>
        <label className="block text-[0.78rem] text-admin-ink-soft">
          % Descuento
          <select value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} disabled={isAntibiotic} className={`${inputClass} mt-1 w-full disabled:opacity-50`}>
            <option value="">Sin descuento</option>
            {DISCOUNTS.map((d) => (
              <option key={d} value={d}>
                {d}%
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-[0.85rem] text-admin-ink">
          <input type="checkbox" checked={twoForOne} disabled={isAntibiotic} onChange={(e) => setTwoForOne(e.target.checked)} className="h-4 w-4 accent-admin-primary disabled:opacity-50" />
          2x1
        </label>
        {isAntibiotic && <p className="text-[0.8rem] font-semibold text-admin-bad-text sm:col-span-2 lg:col-span-3">Es antibiótico — no se le pone descuento ni 2x1.</p>}
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" className={`${inputClass} sm:col-span-2 lg:col-span-3`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || !description.trim() || !expiresOn || !shelf.trim()}
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
