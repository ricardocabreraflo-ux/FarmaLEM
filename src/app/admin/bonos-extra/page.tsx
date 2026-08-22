import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listExtraBonuses } from "@/lib/extra-bonuses";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Bonos extraordinarios" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function ExtraBonusesPage() {
  const session = await requireAdminSession();
  const [profile, bonuses, employees] = await Promise.all([getProfileById(session.uid), listExtraBonuses(), listProfiles()]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const total = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const paid = bonuses.filter((b) => b.status === "Pagado").reduce((sum, b) => sum + b.amount, 0);
  const pending = total - paid;

  return (
    <AdminShell activeHref="/admin/bonos-extra" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Bonos extraordinarios</h1>
        <Link
          href="/admin/bonos-extra/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Registrar bono
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Bonos por puntualidad, desempeño u otros conceptos fuera de la meta de ventas. No se mezclan con el cálculo automático de sueldos y bonos semanales.
      </p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Bonos registrados</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(total)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Pagados</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(paid)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Pendientes</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(pending)}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Mes</th>
              <th className="px-5 py-3 font-medium">Empleado</th>
              <th className="px-5 py-3 font-medium">Concepto</th>
              <th className="px-5 py-3 text-right font-medium">Cantidad</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bonuses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-admin-ink-soft">
                  Sin bonos registrados
                </td>
              </tr>
            )}
            {bonuses.map((b) => (
              <tr key={b.id} className="border-b border-admin-border last:border-0">
                <td className="px-5 py-3 text-admin-ink-soft">{b.month}</td>
                <td className="px-5 py-3 font-semibold text-admin-ink">{nameById.get(b.employee_id) ?? "Desconocido"}</td>
                <td className="px-5 py-3 text-admin-ink-soft">{b.concept}</td>
                <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(b.amount)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                      b.status === "Pagado" ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/bonos-extra/${b.id}`} className="font-semibold text-admin-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
