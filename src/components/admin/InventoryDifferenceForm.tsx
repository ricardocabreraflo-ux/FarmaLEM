"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInventoryDifferenceAction, lookupInventoryDifferenceProductAction } from "@/app/admin/diferencias/actions";
import { INVENTORY_CATEGORIES, categoryForShift } from "@/lib/actividades";
import type { InventoryDifferenceKind, InventoryDifferenceShift } from "@/lib/inventory-differences";

const inputClass =
  "rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function InventoryDifferenceForm({
  defaultShift,
  isAdmin,
  employees,
}: {
  defaultShift: InventoryDifferenceShift;
  isAdmin: boolean;
  employees: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const today = todayISO();
  const todayCategory = categoryForShift(today, defaultShift === "Matutino" ? "matutino" : "vespertino");

  const [diffDate, setDiffDate] = useState(today);
  const [shift, setShift] = useState<InventoryDifferenceShift>(defaultShift);
  const [category, setCategory] = useState(todayCategory?.key ?? INVENTORY_CATEGORIES[0].key);
  const [kind, setKind] = useState<InventoryDifferenceKind>("Faltante");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [observations, setObservations] = useState("");
  const [cashierId, setCashierId] = useState("");

  function reset() {
    setBarcode("");
    setDescription("");
    setUnitPrice("");
    setQuantity("1");
    setObservations("");
  }

  async function onLookup() {
    setError(null);
    setNotice(null);
    const clean = barcode.trim();
    if (!clean) return;
    setLooking(true);
    try {
      const res = await lookupInventoryDifferenceProductAction(clean);
      if (res.ok && res.data) {
        setDescription(res.data.description);
        if (res.data.salePrice != null) setUnitPrice(String(res.data.salePrice));
        setNotice("Encontrado — se llenaron los datos conocidos.");
      } else {
        setNotice("Ese código no está en compras ni en el catálogo. Llena la descripción a mano.");
      }
    } finally {
      setLooking(false);
    }
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await createInventoryDifferenceAction({
        diffDate,
        category,
        shift,
        kind,
        barcode,
        description,
        unitPrice,
        quantity: Number(quantity) || 0,
        observations,
        cashierId,
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
      <h2 className="font-display text-[0.95rem] text-admin-ink">Registrar diferencia de inventario</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setKind("Faltante")}
          className={`rounded-full px-4 py-1.5 text-[0.82rem] font-semibold ${kind === "Faltante" ? "bg-admin-primary text-white" : "border border-admin-border text-admin-ink-soft"}`}
        >
          Faltante (se debe pagar)
        </button>
        <button
          type="button"
          onClick={() => setKind("Sobrante")}
          className={`rounded-full px-4 py-1.5 text-[0.82rem] font-semibold ${kind === "Sobrante" ? "bg-admin-primary text-white" : "border border-admin-border text-admin-ink-soft"}`}
        >
          Sobrante (solo registro)
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-[0.78rem] text-admin-ink-soft">
          Fecha
          <input type="date" value={diffDate} onChange={(e) => setDiffDate(e.target.value)} className={`${inputClass} mt-1 w-full`} />
        </label>
        <label className="block text-[0.78rem] text-admin-ink-soft">
          Categoría
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} mt-1 w-full`}>
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <select value={shift} onChange={(e) => setShift(e.target.value as InventoryDifferenceShift)} className={inputClass}>
          <option value="Matutino">Turno matutino</option>
          <option value="Vespertino">Turno vespertino</option>
        </select>
        {isAdmin && (
          <select value={cashierId} onChange={(e) => setCashierId(e.target.value)} className={inputClass}>
            <option value="">Cajero/a (yo mismo si se deja vacío)</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        )}

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
        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Piezas" className={inputClass} />
        <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="Precio" className={inputClass} />
        <input
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Observaciones (opcional)"
          className={`${inputClass} sm:col-span-2 lg:col-span-3`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || !description.trim()}
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
