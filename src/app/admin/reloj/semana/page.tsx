import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listProfiles } from "@/lib/profiles";
import { listEntradasForRange, mexicoCityToday } from "@/lib/time-clock";
import { addDays, mondayOf } from "@/lib/dates";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Reporte semanal de entradas" };
export const dynamic = "force-dynamic";

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "short" });
}

function entradaLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

function entradaDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(iso));
}

export default async function ReporteSemanalRelojPage({ searchParams }: { searchParams: Promise<{ inicio?: string }> }) {
  await requireAdminSession();
  const { inicio } = await searchParams;
  const monday = mondayOf(inicio || mexicoCityToday());
  const sunday = addDays(monday, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const [profiles, entradas] = await Promise.all([listProfiles(), listEntradasForRange(monday, sunday)]);
  const employees = profiles.filter((p) => p.active && p.role === "employee").sort((a, b) => a.shift.localeCompare(b.shift) || a.full_name.localeCompare(b.full_name));

  const firstEntradaByKey = new Map<string, string>();
  for (const e of entradas) {
    const key = `${e.employee_id}|${entradaDate(e.occurred_at)}`;
    if (!firstEntradaByKey.has(key)) firstEntradaByKey.set(key, e.occurred_at);
  }

  const rangeLabel = `${new Date(`${monday}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} al ${new Date(
    `${sunday}T12:00:00`,
  ).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <main className="mx-auto max-w-[900px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>

      <Link href="/admin/reloj/bitacora" className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a la bitácora
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900">FarmaLEM &middot; Entradas de la semana &middot; {rangeLabel}</h1>
        <PrintButton />
      </div>

      <div className="mt-4 flex items-center gap-3 print:hidden">
        <Link href={`/admin/reloj/semana?inicio=${addDays(monday, -7)}`} className="rounded-full border border-slate-300 px-4 py-2 text-[0.82rem] font-semibold text-slate-700">
          &larr; Semana anterior
        </Link>
        <Link href="/admin/reloj/semana" className="rounded-full border border-slate-300 px-4 py-2 text-[0.82rem] font-semibold text-slate-700">
          Semana actual
        </Link>
        <Link href={`/admin/reloj/semana?inicio=${addDays(monday, 7)}`} className="rounded-full border border-slate-300 px-4 py-2 text-[0.82rem] font-semibold text-slate-700">
          Semana siguiente &rarr;
        </Link>
      </div>

      {employees.length === 0 ? (
        <p className="mt-8 text-slate-500">No hay empleados activos.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Día</th>
              {employees.map((emp) => (
                <th key={emp.id} className="py-2 pr-3 font-medium">
                  {emp.full_name}
                  <span className="block font-normal text-slate-400">{emp.shift}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((date) => (
              <tr key={date} className="border-b border-slate-200">
                <td className="py-1.5 pr-3 text-slate-500 capitalize">{dayLabel(date)}</td>
                {employees.map((emp) => {
                  const iso = firstEntradaByKey.get(`${emp.id}|${date}`);
                  return (
                    <td key={emp.id} className="py-1.5 pr-3 font-data tabular-nums text-slate-900">
                      {iso ? entradaLabel(iso) : <span className="text-slate-400">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
