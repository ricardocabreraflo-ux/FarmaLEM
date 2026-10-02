import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { canAccessModule } from "@/lib/panel-modules";
import { redirect } from "next/navigation";
import { mexicoCityToday } from "@/lib/dates";
import { getOrCreateMonth, listItemsForMonth } from "@/lib/short-expiry";
import { PrintButton } from "@/components/admin/PrintButton";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Relación de caducidad corta" };
export const dynamic = "force-dynamic";

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function ReporteCaducidadCortaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);
  if (!(await canAccessModule("/admin/caducidad-corta", isAdmin, profile?.role_id ?? null))) redirect("/admin");

  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [monthRow, items, employees] = await Promise.all([getOrCreateMonth(month), listItemsForMonth(month), listProfiles()]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  return (
    <main className="mx-auto max-w-[1000px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } @page { size: landscape; } body { background: #fff; } }`}</style>

      <Link href={`/admin/caducidad-corta?mes=${month}`} className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a Caducidad corta
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900 capitalize">FarmaLEM &middot; Caducados y próximos a caducar &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>
      <p className="mt-1 text-[0.85rem] text-slate-600">
        Estado: <span className="font-semibold text-slate-900">{monthRow.status}</span>
        {monthRow.status === "Cerrado" && monthRow.closed_at && ` · cerrado el ${fmtDate(monthRow.closed_at.slice(0, 10))}`}
      </p>

      <div className="print:hidden">
        <MonthPicker month={month} basePath="/admin/caducidad-corta/reporte" className="mt-4 flex items-end gap-3" />
      </div>

      <section className="mt-6">
        <table className="w-full border-collapse text-[0.8rem]">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-2 font-medium">Anaquel</th>
              <th className="py-2 pr-2 font-medium">Producto</th>
              <th className="py-2 pr-2 font-medium">Caduca</th>
              <th className="py-2 pr-2 text-right font-medium">Físicas</th>
              <th className="py-2 pr-2 text-right font-medium">Vendidas</th>
              <th className="py-2 pr-2 text-right font-medium">Restantes</th>
              <th className="py-2 pr-2 font-medium">Desc.</th>
              <th className="py-2 pr-2 text-center font-medium">Sistema</th>
              <th className="py-2 pr-2 text-center font-medium">Baja</th>
              <th className="py-2 font-medium">Reportó</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-4 text-slate-500">
                  No hay productos registrados este mes.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="py-1.5 pr-2 text-slate-600">
                    {item.shelf}
                    {item.carried_from_prev_month && <span className="block text-[0.7rem] text-slate-400">arrastrado</span>}
                  </td>
                  <td className="py-1.5 pr-2 font-semibold text-slate-900">
                    {item.description}
                    {item.barcode && <span className="block text-[0.7rem] font-normal text-slate-500">{item.barcode}</span>}
                  </td>
                  <td className="py-1.5 pr-2 text-slate-600">{fmtDate(item.expires_on)}</td>
                  <td className="py-1.5 pr-2 text-right text-slate-900">{item.physical_pieces}</td>
                  <td className="py-1.5 pr-2 text-right text-slate-900">{item.sold}</td>
                  <td className="py-1.5 pr-2 text-right font-semibold text-slate-900">{item.remaining}</td>
                  <td className="py-1.5 pr-2 text-slate-600">
                    {item.discount_pct ? `${item.discount_pct}%` : "—"}
                    {item.two_for_one && " · 2x1"}
                  </td>
                  <td className="py-1.5 pr-2 text-center text-slate-600">{item.in_system ? "Sí" : "No"}</td>
                  <td className="py-1.5 pr-2 text-center text-slate-600">{item.removed_from_system ? "Sí" : "No"}</td>
                  <td className="py-1.5 text-slate-600">{nameById.get(item.reported_by) ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
