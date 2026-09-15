import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listStockoutReports, type StockoutShift } from "@/lib/stockout-reports";
import { listStockoutCategories } from "@/lib/stockout-categories";
import { canAccessModule } from "@/lib/panel-modules";
import { AdminShell } from "@/components/admin/AdminShell";
import { StockoutForm } from "@/components/admin/StockoutForm";
import { StockoutResolvedCheckbox } from "@/components/admin/StockoutResolvedCheckbox";
import { DeleteStockoutButton } from "@/components/admin/DeleteStockoutButton";

export const metadata: Metadata = { title: "Negados y faltantes" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number | null) {
  return n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function NegadosPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);
  if (!(await canAccessModule("/admin/negados", isAdmin, profile?.role_id ?? null))) redirect("/admin");

  const [reports, employees, categories] = await Promise.all([listStockoutReports(), listProfiles(), listStockoutCategories()]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const today = new Date().toISOString().slice(0, 10);
  const pendientes = reports.filter((r) => !r.resolved);
  const resueltosHoy = reports.filter((r) => r.resolved && r.resolved_at?.slice(0, 10) === today);

  const countBySubstance = new Map<string, number>();
  for (const r of pendientes) {
    const key = r.active_substance.trim().toLowerCase();
    countBySubstance.set(key, (countBySubstance.get(key) ?? 0) + 1);
  }
  const masRepetidos = [...countBySubstance.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const defaultShift: StockoutShift = profile?.shift === "Vespertino" ? "Vespertino" : "Matutino";

  return (
    <AdminShell activeHref="/admin/negados" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Negados y faltantes</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Registra lo que se le niega a un cliente (no lo manejamos) o falta (lo conocemos pero se acabó) — igual que en la hoja del mostrador, para llevar
        control diario y ver qué conviene empezar a surtir.
      </p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Pendientes</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{pendientes.length}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Resueltos hoy</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{resueltosHoy.length}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Total registrado</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{reports.length}</p>
        </div>
      </section>

      {masRepetidos.length > 0 && (
        <section className="mt-4 rounded-2xl border border-admin-pending-bg bg-admin-pending-bg/40 p-4">
          <h2 className="font-display text-[0.9rem] text-admin-ink">Se repiten seguido y siguen pendientes</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {masRepetidos.map(([substance, count]) => (
              <li key={substance} className="rounded-full bg-admin-surface px-3 py-1 text-[0.78rem] font-semibold text-admin-ink">
                {substance} · {count}×
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <StockoutForm defaultShift={defaultShift} isAdmin={isAdmin} categories={categories.map((c) => c.name)} />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Turno</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Sustancia activa</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Presentación</th>
                <th className="px-4 py-3 text-right font-medium">Piezas</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                {isAdmin && <th className="px-4 py-3 text-right font-medium">Costo</th>}
                <th className="px-4 py-3 font-medium">Registró</th>
                <th className="px-4 py-3 text-center font-medium">Resuelto</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 12 : 10} className="px-4 py-8 text-center text-admin-ink-soft">
                    Sin registros todavía
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className={`border-b border-admin-border last:border-0 ${r.resolved ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 text-admin-ink-soft">{fmtDate(r.report_date)}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{r.shift}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                        r.kind === "Negado" ? "bg-admin-bad-bg text-admin-bad-text" : "bg-admin-pending-bg text-admin-pending-text"
                      }`}
                    >
                      {r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-admin-ink">
                    {r.active_substance}
                    {r.barcode && <span className="block text-[0.72rem] font-normal text-admin-ink-soft">{r.barcode}</span>}
                  </td>
                  <td className="px-4 py-3 text-admin-ink-soft">{r.category ?? "—"}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">
                    {r.presentation ?? "—"}
                    {r.gramaje && ` · ${r.gramaje}`}
                  </td>
                  <td className="px-4 py-3 text-right text-admin-ink">{r.quantity}</td>
                  <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(r.sale_price)}</td>
                  {isAdmin && <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(r.cost)}</td>}
                  <td className="px-4 py-3 text-admin-ink-soft">{nameById.get(r.created_by) ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <StockoutResolvedCheckbox id={r.id} initialValue={r.resolved} />
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <DeleteStockoutButton id={r.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
