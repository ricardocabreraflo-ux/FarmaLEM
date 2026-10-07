import type { Metadata } from "next";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listInventoryDifferences, getPendingBalanceByCashier } from "@/lib/inventory-differences";
import { INVENTORY_CATEGORIES } from "@/lib/actividades";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryDifferenceForm } from "@/components/admin/InventoryDifferenceForm";
import { SettleBalanceButton } from "@/components/admin/SettleBalanceButton";
import { DeleteInventoryDifferenceButton } from "@/components/admin/DeleteInventoryDifferenceButton";

export const metadata: Metadata = { title: "Diferencias de inventario" };
export const dynamic = "force-dynamic";

const CATEGORY_LABEL = new Map(INVENTORY_CATEGORIES.map((c) => [c.key, c.label]));

function fmtMoney(n: number | null) {
  return n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function DiferenciasPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);

  const [differences, employees, balances] = await Promise.all([
    listInventoryDifferences(isAdmin ? undefined : session.uid),
    listProfiles(),
    getPendingBalanceByCashier(),
  ]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const defaultShift = profile?.shift === "Vespertino" ? "Vespertino" : "Matutino";
  const visibleBalances = isAdmin
    ? [...balances.entries()].filter(([, amount]) => amount > 0)
    : [...balances.entries()].filter(([id, amount]) => id === session.uid && amount > 0);

  return (
    <AdminShell activeHref="/admin/diferencias" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Diferencias de inventario</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Lo que falta o sobra al terminar de contar la categoría del día — el faltante se suma al saldo pendiente de quien contó, para saber cuánto debe
        pagar.
      </p>

      {visibleBalances.length > 0 && (
        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBalances.map(([cashierId, amount]) => (
            <div key={cashierId} className="rounded-2xl border border-admin-bad-text/30 bg-admin-bad-bg p-4">
              <span className="text-[0.78rem] text-admin-ink-soft">{nameById.get(cashierId) ?? "Alguien"} debe</span>
              <p className="mt-1 font-display text-lg text-admin-bad-text">{fmtMoney(amount)}</p>
              {isAdmin && <SettleBalanceButton cashierId={cashierId} />}
            </div>
          ))}
        </section>
      )}

      <div className="mt-6">
        <InventoryDifferenceForm defaultShift={defaultShift} isAdmin={isAdmin} employees={employees.filter((e) => e.role === "employee" && e.active)} />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Turno</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Piezas</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Cajero/a</th>
                <th className="px-4 py-3 text-center font-medium">Pagado</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {differences.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-admin-ink-soft">
                    Sin registros todavía
                  </td>
                </tr>
              )}
              {differences.map((d) => (
                <tr key={d.id} className={`border-b border-admin-border last:border-0 ${d.settled ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 text-admin-ink-soft">{fmtDate(d.diff_date)}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{CATEGORY_LABEL.get(d.category) ?? d.category}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{d.shift}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                        d.kind === "Faltante" ? "bg-admin-bad-bg text-admin-bad-text" : "bg-admin-pending-bg text-admin-pending-text"
                      }`}
                    >
                      {d.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-admin-ink">
                    {d.description}
                    {d.barcode && <span className="block text-[0.72rem] font-normal text-admin-ink-soft">{d.barcode}</span>}
                    {d.observations && <span className="block text-[0.72rem] font-normal text-admin-ink-soft">{d.observations}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-admin-ink">{d.quantity}</td>
                  <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink">{d.kind === "Faltante" ? fmtMoney(d.amount) : "—"}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{nameById.get(d.cashier_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{d.kind === "Faltante" ? (d.settled ? "Sí" : "No") : "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <DeleteInventoryDifferenceButton id={d.id} />
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
