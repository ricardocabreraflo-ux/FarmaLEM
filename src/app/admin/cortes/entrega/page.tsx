import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listCutsPendingCollection } from "@/lib/cuts";
import { hasCapability } from "@/lib/panel-modules";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Reporte de entrega de efectivo" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export default async function ReporteEntregaPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);
  const canReview = isAdmin || (await hasCapability("cortes:revisar", isAdmin, profile?.role_id ?? null));
  if (!canReview) redirect("/admin/cortes");

  // Administración ve todo lo pendiente de recoger, sin importar quién lo aprobó
  // (ya tiene esa vista global); quien solo tiene la capacidad de revisar ve
  // nada más lo que ella misma aprobó — es su propio reporte de lo que va a entregar.
  const [cuts, employees] = await Promise.all([listCutsPendingCollection(isAdmin ? undefined : session.uid), listProfiles()]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));
  const total = cuts.reduce((s, c) => s + c.cash_delivered, 0);

  return (
    <main className="mx-auto max-w-[760px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>

      <Link href="/admin/cortes" className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a Cortes
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900">FarmaLEM &middot; Reporte de entrega de efectivo</h1>
        <PrintButton />
      </div>
      <p className="mt-1 text-[0.85rem] text-slate-600">
        Preparado por <span className="font-semibold text-slate-900">{profile?.full_name ?? "Sin nombre"}</span> el {fmtDate(new Date().toISOString().slice(0, 10))}
      </p>

      <section className="mt-6">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Fecha</th>
              <th className="py-2 pr-3 font-medium">Turno</th>
              <th className="py-2 pr-3 font-medium">Empleado</th>
              <th className="py-2 text-right font-medium">Efectivo entregado</th>
            </tr>
          </thead>
          <tbody>
            {cuts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-slate-500">
                  No hay cortes pendientes de entregar.
                </td>
              </tr>
            ) : (
              cuts.map((c) => (
                <tr key={c.id} className="border-b border-slate-200">
                  <td className="py-1.5 pr-3 text-slate-500 capitalize">{fmtDate(c.cut_date)}</td>
                  <td className="py-1.5 pr-3 text-slate-500">{c.shift}</td>
                  <td className="py-1.5 pr-3 font-semibold text-slate-900">{nameById.get(c.employee_id) ?? "Desconocido"}</td>
                  <td className="py-1.5 text-right font-data tabular-nums text-slate-900">{fmtMoney(c.cash_delivered)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
              <td className="py-2 pr-3" colSpan={3}>
                Total a entregar
              </td>
              <td className="py-2 text-right font-data tabular-nums">{fmtMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </main>
  );
}
