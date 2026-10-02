import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { canAccessModule } from "@/lib/panel-modules";
import { mexicoCityToday } from "@/lib/dates";
import { getOrCreateMonth, listItemsForMonth } from "@/lib/short-expiry";
import { AdminShell } from "@/components/admin/AdminShell";
import { ShortExpiryForm } from "@/components/admin/ShortExpiryForm";
import { ShortExpiryList } from "@/components/admin/ShortExpiryList";
import { CloseShortExpiryMonthButton } from "@/components/admin/CloseShortExpiryMonthButton";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Caducidad corta" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function CaducidadCortaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);
  if (!(await canAccessModule("/admin/caducidad-corta", isAdmin, profile?.role_id ?? null))) redirect("/admin");

  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [monthRow, items, employees] = await Promise.all([getOrCreateMonth(month), listItemsForMonth(month), listProfiles()]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));
  const monthOpen = monthRow.status === "Abierto";

  const today = mexicoCityToday();
  const vencidos = items.filter((i) => i.expires_on <= today && i.remaining > 0).length;
  const conExistencia = items.filter((i) => i.remaining > 0).length;

  return (
    <AdminShell activeHref="/admin/caducidad-corta" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-admin-ink capitalize">Caducidad corta · {monthLabel(month)}</h1>
          <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
            Productos próximos a caducar con descuento mientras se venden — {monthOpen ? "mes abierto, se puede seguir capturando." : "mes cerrado, solo lectura."}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[0.78rem] font-semibold ${monthOpen ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"}`}>
          {monthOpen ? "Abierto" : "Cerrado"}
        </span>
      </div>

      <MonthPicker month={month} basePath="/admin/caducidad-corta" className="mt-4 flex items-end gap-3" />

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Con existencia</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{conExistencia}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Ya caducados (con piezas)</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{vencidos}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Total registrados</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{items.length}</p>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href={`/admin/caducidad-corta/reporte?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Ver / imprimir relación
        </Link>
        {isAdmin && monthOpen && <CloseShortExpiryMonthButton month={month} />}
      </div>

      {monthOpen && (
        <div className="mt-6">
          <ShortExpiryForm month={month} />
        </div>
      )}

      <div className="mt-6">
        <ShortExpiryList items={items} isAdmin={isAdmin} monthOpen={monthOpen} nameById={nameById} />
      </div>
    </AdminShell>
  );
}
