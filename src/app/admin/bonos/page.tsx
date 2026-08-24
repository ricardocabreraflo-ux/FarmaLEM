import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listBonusTiers, listBonusWeeks, earnedBonus, targetForWeek } from "@/lib/bonuses";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Bonos semanales" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function BonosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees, weeks, tiers] = await Promise.all([
    getProfileById(session.uid),
    listProfiles(),
    listBonusWeeks(month),
    listBonusTiers(month),
  ]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const totalEarned = weeks.reduce((sum, w) => sum + earnedBonus(w, tiers), 0);
  const weeksWithBonus = weeks.filter((w) => earnedBonus(w, tiers) > 0).length;
  const weeksLostByAbsence = weeks.filter((w) => w.absent).length;

  return (
    <AdminShell activeHref="/admin/bonos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Bonos semanales</h1>
        <div className="flex gap-2">
          <Link href={`/admin/bonos/metas?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
            Configurar metas
          </Link>
          <Link
            href={`/admin/bonos/nuevo?mes=${month}`}
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            + Calcular semana
          </Link>
        </div>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Pirámide de cuatro niveles; una falta elimina solamente el bono de esa semana.</p>

      <MonthPicker month={month} basePath="/admin/bonos" />

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Bonos ganados</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(totalEarned)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Semanas con bono</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{weeksWithBonus}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Perdidos por ausencia</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{weeksLostByAbsence}</p>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
          <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Resultados semanales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.84rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Semana</th>
                  <th className="px-4 py-2.5 font-medium">Empleado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ventas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Meta alcanzada</th>
                  <th className="px-4 py-2.5 text-right font-medium">Bono</th>
                  <th className="px-4 py-2.5 font-medium">Resultado</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {weeks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-admin-ink-soft">
                      Sin semanas calculadas
                    </td>
                  </tr>
                )}
                {weeks.map((w) => {
                  const bonus = earnedBonus(w, tiers);
                  return (
                    <tr key={w.id} className="border-b border-admin-border last:border-0">
                      <td className="px-4 py-2.5 text-admin-ink-soft">Semana {w.week}</td>
                      <td className="px-4 py-2.5 font-semibold text-admin-ink">{nameById.get(w.employee_id) ?? "Desconocido"}</td>
                      <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(w.sales)}</td>
                      <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink-soft">{bonus > 0 ? fmtMoney(targetForWeek(w, tiers)) : "—"}</td>
                      <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(bonus)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                            w.absent ? "bg-admin-bad-bg text-admin-bad-text" : bonus > 0 ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"
                          }`}
                        >
                          {w.absent ? "Perdido por falta" : bonus > 0 ? "Nivel alcanzado" : "Sin meta"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/admin/bonos/${w.id}?mes=${month}`} className="font-semibold text-admin-primary hover:underline">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
          <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Pirámide de metas &middot; {month}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.84rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-4 py-2.5 font-medium">Turno</th>
                  <th className="px-4 py-2.5 font-medium">Nivel</th>
                  <th className="px-4 py-2.5 text-right font-medium">Meta semanal</th>
                  <th className="px-4 py-2.5 text-right font-medium">Promedio diario</th>
                  <th className="px-4 py-2.5 text-right font-medium">Bono</th>
                </tr>
              </thead>
              <tbody>
                {tiers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-admin-ink-soft">
                      Configura las metas de este mes
                    </td>
                  </tr>
                )}
                {tiers.map((t) => (
                  <tr key={t.id} className="border-b border-admin-border last:border-0">
                    <td className="px-4 py-2.5 text-admin-ink-soft">{t.shift}</td>
                    <td className="px-4 py-2.5 text-admin-ink-soft">{t.level}</td>
                    <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(t.goal)}</td>
                    <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(t.goal / 7)}</td>
                    <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(t.bonus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
