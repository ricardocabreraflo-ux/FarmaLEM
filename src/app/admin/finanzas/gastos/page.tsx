import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { getProfileById } from "@/lib/profiles";
import { listExpenseTemplates } from "@/lib/expense-templates";
import { listFinanceMovementsForMonth } from "@/lib/finance-movements";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonthPicker } from "@/components/admin/MonthPicker";
import { CaptureExpenseButton } from "@/components/admin/CaptureExpenseButton";

export const metadata: Metadata = { title: "Gastos fijos y variables" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function GastosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [profile, templates, movements] = await Promise.all([getProfileById(session.uid), listExpenseTemplates(), listFinanceMovementsForMonth(month)]);

  const capturedTemplateIds = new Set(movements.map((m) => m.template_id).filter(Boolean));
  const gastoMovements = movements.filter((m) => m.type === "Gasto fijo" || m.type === "Gasto variable");
  const totalFijo = gastoMovements.filter((m) => m.type === "Gasto fijo").reduce((s, m) => s + m.amount, 0);
  const totalVariable = gastoMovements.filter((m) => m.type === "Gasto variable").reduce((s, m) => s + m.amount, 0);

  return (
    <AdminShell activeHref="/admin/finanzas/gastos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Gastos fijos y variables</h1>
        <Link
          href="/admin/finanzas/gastos/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Nuevo gasto recurrente
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Da de alta cada gasto una sola vez y regístralo con un toque cada mes.</p>

      <MonthPicker month={month} basePath="/admin/finanzas/gastos" />

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Gastos fijos del mes</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalFijo)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Gastos variables del mes</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalVariable)}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Catálogo de gastos recurrentes</h2>
        {templates.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Sin gastos recurrentes dados de alta.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 text-right font-medium">Monto estimado</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-admin-border last:border-0">
                    <td className="px-5 py-3 font-semibold text-admin-ink">{t.name}</td>
                    <td className="px-5 py-3 text-admin-ink-soft">{t.type}</td>
                    <td className="px-5 py-3 text-admin-ink-soft">{t.category}</td>
                    <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(t.amount)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                          t.active ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-bad-bg text-admin-bad-text"
                        }`}
                      >
                        {t.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {t.active && (
                        <CaptureExpenseButton
                          templateId={t.id}
                          name={t.name}
                          type={t.type}
                          category={t.category}
                          defaultAmount={t.amount}
                          month={month}
                          alreadyCaptured={capturedTemplateIds.has(t.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Gastos capturados este mes</h2>
        {gastoMovements.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Sin gastos fijos o variables capturados este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Concepto</th>
                  <th className="px-5 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastoMovements.map((m) => (
                  <tr key={m.id} className="border-b border-admin-border last:border-0">
                    <td className="px-5 py-3 text-admin-ink-soft">{new Date(`${m.movement_date}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</td>
                    <td className="px-5 py-3 text-admin-ink-soft">{m.type}</td>
                    <td className="px-5 py-3 text-admin-ink-soft">{m.category}</td>
                    <td className="px-5 py-3 text-admin-ink">{m.concept}</td>
                    <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(m.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
