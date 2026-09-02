"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createCutForm, type CutFormState } from "@/app/admin/cortes/actions";
import { DenominationsModal } from "@/components/admin/DenominationsModal";
import { mexicoCityToday } from "@/lib/dates";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

const DRAFT_KEY = "farmalem-cutform-draft";

interface CutDraft {
  cutDate: string;
  total: string;
  card: string;
  cashDelivered: string;
  nomina: string;
  hasCounted: boolean;
}

export function CutForm({
  employees,
  defaultShift,
  canChooseShift,
  minDate,
  isAdmin,
}: {
  employees: Profile[];
  defaultShift: string;
  canChooseShift: boolean;
  minDate?: string;
  isAdmin?: boolean;
}) {
  const [state, formAction, pending] = useActionState<CutFormState | undefined, FormData>(createCutForm, undefined);
  const [cutDate, setCutDate] = useState(mexicoCityToday());
  const [total, setTotal] = useState("");
  const [card, setCard] = useState("");
  const [cashDelivered, setCashDelivered] = useState("");
  const [nomina, setNomina] = useState("");
  const [hasCounted, setHasCounted] = useState(false);
  const [showDenomModal, setShowDenomModal] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const hydratedRef = useRef(false);

  // Recupera lo que ya se había escrito si la página se tuvo que recargar a
  // medio capturar (p.ej. por una actualización del panel) — para no hacer
  // que vuelvan a teclear todo. localStorage no existe en el servidor, así
  // que esto solo se puede leer ya montado en el cliente: es justo el caso
  // que react-hooks/set-state-in-effect no puede distinguir de un mal uso.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<CutDraft>;
        if (draft.cutDate) setCutDate(draft.cutDate);
        if (draft.total) setTotal(draft.total);
        if (draft.card) setCard(draft.card);
        if (draft.cashDelivered) setCashDelivered(draft.cashDelivered);
        if (draft.nomina) setNomina(draft.nomina);
        if (draft.hasCounted) setHasCounted(true);
        if (draft.total || draft.card || draft.cashDelivered) setRestoredDraft(true);
      }
    } catch {
      // sin localStorage disponible: no pasa nada, solo no hay respaldo
    }
    hydratedRef.current = true;
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ cutDate, total, card, cashDelivered, nomina, hasCounted }));
    } catch {
      // localStorage lleno o no disponible: no hay respaldo, pero no rompe la captura
    }
  }, [cutDate, total, card, cashDelivered, nomina, hasCounted]);

  const weekday = new Date(`${cutDate}T12:00:00`).getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  // Fin de semana solo abre un turno al día; por convención el sábado cuenta como
  // Matutino y el domingo como Vespertino, sin importar quién lo cubra.
  const weekendShift = weekday === 6 ? "Matutino" : "Vespertino";

  const totalNum = Number(total || 0);
  const cardNum = Number(card || 0);
  const cash = Math.max(totalNum - cardNum, 0);
  const cardExceedsTotal = cardNum > totalNum;

  // A las empleadas solo se les pide nómina el fin de semana (que es cuando se paga
  // normalmente); administración la puede capturar cualquier día al meter un corte a mano.
  const showNomina = isWeekend || canChooseShift;
  const nominaNum = showNomina ? Number(nomina || 0) : 0;
  const expectedCash = Math.max(cash - nominaNum, 0);

  const cashDeliveredNum = Number(cashDelivered || 0);
  const hasDeliveredValue = cashDelivered !== "";
  const deliveredDiff = cashDeliveredNum - expectedCash;
  const deliveredMatches = Math.abs(deliveredDiff) < 0.005;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {restoredDraft && (
        <p className="rounded-lg bg-admin-pending-bg px-4 py-3 text-[0.85rem] text-admin-pending-text">
          Recuperamos lo que tenías escrito de un intento anterior — revísalo antes de guardar.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="cutDate" type="date" required min={minDate} value={cutDate} onChange={(e) => setCutDate(e.target.value)} className={inputClass} />
          {minDate && <span className="mt-1 block font-normal text-admin-ink-soft">Solo puedes capturar del mes en curso en adelante.</span>}
        </label>

        {employees.length > 0 && (
          <label className="block text-[0.85rem] font-semibold text-admin-ink">
            Empleado
            <select name="employeeId" className={inputClass}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Turno
          {isWeekend ? (
            <>
              <input type="hidden" name="shift" value={weekendShift} />
              <div className={`${inputClass} bg-admin-primary-soft font-semibold text-admin-primary-deep`}>Fin de semana</div>
              <span className="mt-1 block font-normal text-admin-ink-soft">Solo hay un turno el fin de semana.</span>
            </>
          ) : canChooseShift ? (
            <select name="shift" defaultValue={defaultShift} className={inputClass}>
              <option>Matutino</option>
              <option>Vespertino</option>
            </select>
          ) : (
            <>
              <input type="hidden" name="shift" value={defaultShift} />
              <div className={`${inputClass} bg-admin-primary-soft font-semibold text-admin-primary-deep`}>{defaultShift} (tu turno)</div>
            </>
          )}
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Venta total
          <input name="total" type="number" min="0" step="0.01" required value={total} onChange={(e) => setTotal(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Tarjeta / transferencia
          <input name="card" type="number" min="0" step="0.01" value={card} onChange={(e) => setCard(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Efectivo <span className="font-normal text-admin-ink-soft">(venta total − tarjeta)</span>
          <input name="cash" type="number" readOnly value={cash.toFixed(2)} className={`${inputClass} bg-admin-bg/60 text-admin-ink-soft`} />
        </label>

        {showNomina && (
          <label className="block text-[0.85rem] font-semibold text-admin-ink">
            Pago de nómina de esta semana <span className="font-normal text-admin-ink-soft">(si se pagó de este corte)</span>
            <input name="nomina" type="number" min="0" step="0.01" placeholder="0.00" value={nomina} onChange={(e) => setNomina(e.target.value)} className={inputClass} />
            <span className="mt-1 block font-normal text-admin-ink-soft">Se resta del efectivo esperado y se registra como salida de nómina.</span>
          </label>
        )}

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Efectivo entregado <span className="font-normal text-admin-ink-soft">(cuenta física)</span>
          <div className="mt-1.5 flex gap-2">
            <input
              name="cashDelivered"
              type="number"
              min="0"
              step="0.01"
              readOnly={!isAdmin}
              required
              placeholder="Sin contar"
              value={cashDelivered}
              onChange={isAdmin ? (e) => setCashDelivered(e.target.value) : undefined}
              className={`${inputClass} mt-0 ${!isAdmin ? "cursor-not-allowed bg-admin-bg/60 text-admin-ink-soft" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowDenomModal(true)}
              className="shrink-0 rounded-lg bg-admin-primary px-3.5 text-[0.82rem] font-semibold whitespace-nowrap text-white"
            >
              Contar efectivo
            </button>
          </div>
          {isAdmin ? (
            <span className="mt-1 block font-normal text-admin-ink-soft">
              Puedes escribirlo directo (por ejemplo al capturar un corte atrasado sin el efectivo físico), o usar &quot;Contar efectivo&quot; si sí lo tienes a la mano.
            </span>
          ) : (
            !hasCounted && <span className="mt-1 block font-normal text-admin-bad-text">Obligatorio: cuenta el efectivo por denominación.</span>
          )}
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Foto del corte (opcional)
          <input name="photo" type="file" accept="image/*" capture="environment" className={`${inputClass} py-2`} />
          <span className="mt-1 block font-normal text-admin-ink-soft">En el celular abre la cámara directamente.</span>
        </label>

        {isAdmin && (
          <label className="flex items-start gap-2.5 text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
            <input type="checkbox" name="markPending" value="1" className="mt-0.5" />
            <span>
              Dejarlo &quot;Por revisar&quot;, como si lo hubiera capturado ella
              <span className="mt-0.5 block font-normal text-admin-ink-soft">
                Útil al migrar cortes atrasados: queda pendiente de aprobar en vez de aprobarse solo por ser tú quien lo captura.
              </span>
            </span>
          </label>
        )}
      </div>

      <DenominationsModal
        show={showDenomModal}
        expected={expectedCash}
        onConfirm={(computedTotal) => {
          setCashDelivered(computedTotal.toFixed(2));
          setHasCounted(true);
          setShowDenomModal(false);
        }}
        onClose={() => setShowDenomModal(false)}
      />

      <p
        className={`rounded-lg px-4 py-3 text-[0.85rem] ${
          cardExceedsTotal || (hasDeliveredValue && !deliveredMatches) ? "bg-admin-bad-bg text-admin-bad-text" : "bg-admin-primary-soft text-admin-primary-deep"
        }`}
      >
        {cardExceedsTotal
          ? "La tarjeta/transferencia no puede ser mayor a la venta total."
          : !hasDeliveredValue
            ? "Captura el efectivo entregado para comprobar el corte."
            : deliveredMatches
              ? "✓ El efectivo entregado coincide con lo esperado."
              : deliveredDiff < 0
                ? `Faltan ${Math.abs(deliveredDiff).toFixed(2)} en el efectivo entregado.`
                : `Sobran ${deliveredDiff.toFixed(2)} en el efectivo entregado.`}
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/cortes" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending || cardExceedsTotal || (!isAdmin && !hasCounted) || (isAdmin && !hasDeliveredValue)}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar corte"}
        </button>
      </div>
    </form>
  );
}
