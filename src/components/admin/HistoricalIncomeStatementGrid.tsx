"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHistoricalMonthAction, approveHistoricalMonthAction, unapproveHistoricalMonthAction } from "@/app/admin/finanzas/historico/actions";
import type { HistoricalIncomeStatement, HistoricalIncomeStatementInput } from "@/lib/historical-financials";

interface MonthState {
  ventas: string;
  costos: string;
  gastoRenta: string;
  gastoLuzAgua: string;
  gastoBonos: string;
  gastoSueldos: string;
  gastoVarios: string;
  gastoPapeleria: string;
  gastoSistema: string;
  gastoInternet: string;
  perdidasMerma: string;
}

type FieldKey = keyof MonthState;

const EMPTY: MonthState = {
  ventas: "",
  costos: "",
  gastoRenta: "",
  gastoLuzAgua: "",
  gastoBonos: "",
  gastoSueldos: "",
  gastoVarios: "",
  gastoPapeleria: "",
  gastoSistema: "",
  gastoInternet: "",
  perdidasMerma: "",
};

const GASTO_ROWS: { key: FieldKey; label: string }[] = [
  { key: "gastoRenta", label: "Renta" },
  { key: "gastoLuzAgua", label: "Luz y Agua" },
  { key: "gastoBonos", label: "Bonos" },
  { key: "gastoSueldos", label: "Sueldos" },
  { key: "gastoVarios", label: "Varios" },
  { key: "gastoPapeleria", label: "Papelería" },
  { key: "gastoSistema", label: "Sistema" },
  { key: "gastoInternet", label: "Internet" },
];

function toState(s: HistoricalIncomeStatement | null): MonthState {
  if (!s) return EMPTY;
  return {
    ventas: s.ventas ? String(s.ventas) : "",
    costos: s.costos ? String(s.costos) : "",
    gastoRenta: s.gasto_renta ? String(s.gasto_renta) : "",
    gastoLuzAgua: s.gasto_luz_agua ? String(s.gasto_luz_agua) : "",
    gastoBonos: s.gasto_bonos ? String(s.gasto_bonos) : "",
    gastoSueldos: s.gasto_sueldos ? String(s.gasto_sueldos) : "",
    gastoVarios: s.gasto_varios ? String(s.gasto_varios) : "",
    gastoPapeleria: s.gasto_papeleria ? String(s.gasto_papeleria) : "",
    gastoSistema: s.gasto_sistema ? String(s.gasto_sistema) : "",
    gastoInternet: s.gasto_internet ? String(s.gasto_internet) : "",
    perdidasMerma: s.perdidas_merma ? String(s.perdidas_merma) : "",
  };
}

function n(v: string): number {
  return Number(v || 0);
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function HistoricalIncomeStatementGrid({
  months,
  initialStatements,
  employeeNames,
}: {
  months: string[];
  initialStatements: (HistoricalIncomeStatement | null)[];
  employeeNames: Record<string, string>;
}) {
  const router = useRouter();
  const [approved, setApproved] = useState<boolean[]>(initialStatements.map((s) => s?.approved ?? false));
  const [approvedBy, setApprovedBy] = useState<(string | null)[]>(initialStatements.map((s) => s?.approved_by ?? null));
  const [values, setValues] = useState<MonthState[]>(initialStatements.map(toState));
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<(string | null)[]>(months.map(() => null));

  function setField(idx: number, key: FieldKey, value: string) {
    setValues((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  }

  function computed(idx: number) {
    const v = values[idx];
    const ventas = n(v.ventas);
    const costos = n(v.costos);
    const gastos = GASTO_ROWS.reduce((sum, r) => sum + n(v[r.key]), 0);
    const utilidadBruta = ventas - costos;
    const utilidadNeta = utilidadBruta - gastos;
    return { ventas, costos, gastos, utilidadBruta, utilidadNeta };
  }

  function toInput(idx: number): HistoricalIncomeStatementInput {
    const v = values[idx];
    return {
      ventas: n(v.ventas),
      costos: n(v.costos),
      gastoRenta: n(v.gastoRenta),
      gastoLuzAgua: n(v.gastoLuzAgua),
      gastoBonos: n(v.gastoBonos),
      gastoSueldos: n(v.gastoSueldos),
      gastoVarios: n(v.gastoVarios),
      gastoPapeleria: n(v.gastoPapeleria),
      gastoSistema: n(v.gastoSistema),
      gastoInternet: n(v.gastoInternet),
      perdidasMerma: n(v.perdidasMerma),
    };
  }

  function setError(idx: number, message: string | null) {
    setErrors((prev) => prev.map((e, i) => (i === idx ? message : e)));
  }

  async function handleSave(idx: number) {
    setBusyIdx(idx);
    setError(idx, null);
    const res = await saveHistoricalMonthAction(months[idx], toInput(idx));
    setBusyIdx(null);
    if (res.ok) router.refresh();
    else setError(idx, res.error ?? "No se pudo guardar.");
  }

  async function handleApprove(idx: number) {
    const ok = window.confirm(`¿Aprobar ${monthLabel(months[idx])}? Después de aprobarlo queda fijo y ya no se puede editar (a menos que lo desbloquees).`);
    if (!ok) return;
    setBusyIdx(idx);
    setError(idx, null);
    // Guarda lo que haya en pantalla antes de aprobar, por si no le habían dado Guardar.
    const saveRes = await saveHistoricalMonthAction(months[idx], toInput(idx));
    if (!saveRes.ok) {
      setBusyIdx(null);
      setError(idx, saveRes.error ?? "No se pudo guardar.");
      return;
    }
    const res = await approveHistoricalMonthAction(months[idx]);
    setBusyIdx(null);
    if (res.ok) {
      setApproved((prev) => prev.map((a, i) => (i === idx ? true : a)));
      router.refresh();
    } else {
      setError(idx, res.error ?? "No se pudo aprobar.");
    }
  }

  async function handleUnapprove(idx: number) {
    const ok = window.confirm(`¿Desbloquear ${monthLabel(months[idx])} para poder editarlo otra vez?`);
    if (!ok) return;
    setBusyIdx(idx);
    setError(idx, null);
    const res = await unapproveHistoricalMonthAction(months[idx]);
    setBusyIdx(null);
    if (res.ok) {
      setApproved((prev) => prev.map((a, i) => (i === idx ? false : a)));
      setApprovedBy((prev) => prev.map((a, i) => (i === idx ? null : a)));
      router.refresh();
    } else {
      setError(idx, res.error ?? "No se pudo desbloquear.");
    }
  }

  function Cell({ idx, field }: { idx: number; field: FieldKey }) {
    if (approved[idx]) return <span className="font-data tabular-nums text-admin-ink">{fmtMoney(n(values[idx][field]))}</span>;
    return (
      <input
        type="number"
        step="0.01"
        placeholder="0.00"
        value={values[idx][field]}
        onChange={(e) => setField(idx, field, e.target.value)}
        className="w-28 rounded-lg border border-admin-border bg-admin-input-bg px-2 py-1.5 text-right font-data text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface">
      <table className="w-full min-w-[900px] border-collapse text-[0.82rem]">
        <thead>
          <tr className="border-b border-admin-border bg-admin-bg">
            <th className="px-3 py-2.5 text-left font-medium text-admin-ink-soft">Concepto</th>
            {months.map((month, idx) => (
              <th key={month} className="px-3 py-2.5 text-center align-top">
                <div className="font-display text-[0.82rem] font-bold text-admin-ink capitalize">{monthLabel(month)}</div>
                <div className="mt-1.5 flex flex-col items-center gap-1">
                  {approved[idx] ? (
                    <>
                      <span className="rounded-full bg-admin-ok-bg px-2.5 py-0.5 text-[0.7rem] font-bold text-admin-ok-text">
                        ✓ Aprobado{approvedBy[idx] ? ` · ${employeeNames[approvedBy[idx] as string] ?? ""}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnapprove(idx)}
                        disabled={busyIdx === idx}
                        className="text-[0.7rem] text-admin-ink-soft underline decoration-dotted disabled:opacity-50"
                      >
                        Desbloquear
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSave(idx)}
                        disabled={busyIdx === idx}
                        className="rounded-full border border-admin-border px-2.5 py-1 text-[0.7rem] font-semibold text-admin-ink disabled:opacity-50"
                      >
                        {busyIdx === idx ? "…" : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(idx)}
                        disabled={busyIdx === idx}
                        className="rounded-full bg-admin-primary px-2.5 py-1 text-[0.7rem] font-semibold text-white disabled:opacity-50"
                      >
                        {busyIdx === idx ? "…" : "Aprobar"}
                      </button>
                    </div>
                  )}
                  {errors[idx] && <p className="max-w-[140px] text-[0.66rem] font-normal text-admin-bad-text">{errors[idx]}</p>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-admin-border">
            <td className="px-3 py-2 font-bold text-admin-ink">VENTAS</td>
            {months.map((month, idx) => (
              <td key={month} className="px-3 py-2 text-right">
                <Cell idx={idx} field="ventas" />
              </td>
            ))}
          </tr>
          <tr className="border-b border-admin-border">
            <td className="px-3 py-2 font-bold text-admin-ink">COSTOS</td>
            {months.map((month, idx) => (
              <td key={month} className="px-3 py-2 text-right">
                <Cell idx={idx} field="costos" />
              </td>
            ))}
          </tr>
          <tr className="border-b border-admin-border bg-admin-bg/60">
            <td className="px-3 py-2 font-bold text-admin-ink">UTILIDAD BRUTA</td>
            {months.map((month, idx) => (
              <td key={month} className="px-3 py-2 text-right font-data font-bold tabular-nums text-admin-ink">
                {fmtMoney(computed(idx).utilidadBruta)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-admin-border bg-admin-bg/60">
            <td className="px-3 py-2 font-bold text-admin-ink">GASTOS</td>
            {months.map((month, idx) => (
              <td key={month} className="px-3 py-2 text-right font-data font-bold tabular-nums text-admin-ink">
                {fmtMoney(computed(idx).gastos)}
              </td>
            ))}
          </tr>
          <tr className="border-b-2 border-admin-border bg-admin-bg/60">
            <td className="px-3 py-2 font-bold text-admin-ink">UTILIDAD NETA O PÉRDIDA</td>
            {months.map((month, idx) => {
              const value = computed(idx).utilidadNeta;
              return (
                <td key={month} className={`px-3 py-2 text-right font-data font-bold tabular-nums ${value < 0 ? "text-admin-bad-text" : "text-admin-ink"}`}>
                  {fmtMoney(value)}
                </td>
              );
            })}
          </tr>

          <tr>
            <td className="px-3 py-2" colSpan={months.length + 1}></td>
          </tr>

          {GASTO_ROWS.map((row) => (
            <tr key={row.key} className="border-b border-admin-border">
              <td className="px-3 py-2 text-admin-ink-soft">{row.label}</td>
              {months.map((month, idx) => (
                <td key={month} className="px-3 py-2 text-right">
                  <Cell idx={idx} field={row.key} />
                </td>
              ))}
            </tr>
          ))}

          <tr className="border-b-2 border-admin-border bg-admin-bg/60">
            <td className="px-3 py-2 font-bold text-admin-ink">Total</td>
            {months.map((month, idx) => (
              <td key={month} className="px-3 py-2 text-right font-data font-bold tabular-nums text-admin-ink">
                {fmtMoney(computed(idx).gastos)}
              </td>
            ))}
          </tr>

          <tr>
            <td className="px-3 py-2" colSpan={months.length + 1}></td>
          </tr>

          <tr>
            <td className="px-3 py-2 font-bold text-admin-ink">PÉRDIDAS MERMA</td>
            {months.map((month, idx) => (
              <td key={month} className="px-3 py-2 text-right">
                <Cell idx={idx} field="perdidasMerma" />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
