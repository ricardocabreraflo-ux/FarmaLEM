import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listCutsForMonth, getCutPhotoUrl } from "@/lib/cuts";
import { AdminShell } from "@/components/admin/AdminShell";
import { CutsList } from "@/components/admin/CutsList";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Cortes" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function CortesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, cuts, employees] = await Promise.all([
    getProfileById(session.uid),
    listCutsForMonth(month, isAdmin ? undefined : session.uid),
    listProfiles(),
  ]);

  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));
  const rows = await Promise.all(
    cuts.map(async (cut) => ({
      ...cut,
      employeeName: nameById.get(cut.employee_id) ?? "Desconocido",
      photoUrl: cut.photo_path ? await getCutPhotoUrl(cut.photo_path) : null,
    }))
  );

  const totalVentas = cuts.reduce((s, c) => s + c.total, 0);
  const totalEfectivo = cuts.reduce((s, c) => s + c.cash, 0);
  const totalTarjeta = cuts.reduce((s, c) => s + c.card, 0);
  const totalEntregado = cuts.reduce((s, c) => s + c.cash_delivered, 0);

  return (
    <AdminShell activeHref="/admin/cortes" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Cortes</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/cortes/reporte?mes=${month}`} target="_blank" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
            Reporte mensual
          </Link>
          <Link
            href="/admin/cortes/nuevo"
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            + Capturar corte
          </Link>
        </div>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Un registro por trabajador y turno.</p>

      <MonthPicker month={month} basePath="/admin/cortes" />

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Venta total</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalVentas)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Efectivo</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalEfectivo)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Tarjeta</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalTarjeta)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Efectivo entregado</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalEntregado)}</p>
        </div>
      </section>

      <div className="mt-6">
        <CutsList cuts={rows} isAdmin={isAdmin} />
      </div>
    </AdminShell>
  );
}
