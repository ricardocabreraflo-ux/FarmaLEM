import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listCutsForMonth, listCutsForRange, getCutPhotoUrl, getPendingCashCollection } from "@/lib/cuts";
import { hasCapability } from "@/lib/panel-modules";
import { AdminShell } from "@/components/admin/AdminShell";
import { CutsList } from "@/components/admin/CutsList";
import { MonthPicker } from "@/components/admin/MonthPicker";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";

export const metadata: Metadata = { title: "Cortes" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CortesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; guardado?: string; desde?: string; hasta?: string }>;
}) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const { guardado } = await searchParams;

  const profile = await getProfileById(session.uid);
  // Poder revisar/aprobar cortes de otras personas implica también ver el reporte
  // completo (no tendría caso aprobar lo que no puedes ver) y ver los cortes de
  // todo el equipo, no solo los propios.
  const canReview = isAdmin || (await hasCapability("cortes:revisar", isAdmin, profile?.role_id ?? null));
  const canViewFull = canReview || (await hasCapability("cortes:reporte", isAdmin, profile?.role_id ?? null));
  const seeAllEmployees = isAdmin || canReview;

  if (!canViewFull) {
    return (
      <AdminShell activeHref="/admin/cortes" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
        <h1 className="font-display text-2xl text-admin-ink">Cortes</h1>
        <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Un registro por trabajador y turno.</p>

        {guardado === "1" && (
          <>
            <p className="mt-4 rounded-xl bg-admin-ok-bg px-4 py-3 text-[0.85rem] font-semibold text-admin-ok-text">✓ Corte guardado correctamente.</p>
            <script dangerouslySetInnerHTML={{ __html: `try{localStorage.removeItem("farmalem-cutform-draft")}catch(e){}` }} />
          </>
        )}

        <Link
          href="/admin/cortes/nuevo"
          className="mt-5 block w-full max-w-[380px] rounded-2xl bg-admin-primary px-6 py-5 text-center text-[0.95rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Capturar corte
        </Link>
      </AdminShell>
    );
  }

  const { mes, desde, hasta } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);
  const inRange = Boolean(desde && hasta);

  const [cuts, employees, pendingCash] = await Promise.all([
    inRange
      ? listCutsForRange(desde!, hasta!, seeAllEmployees ? undefined : session.uid)
      : listCutsForMonth(month, seeAllEmployees ? undefined : session.uid),
    listProfiles(),
    isAdmin ? getPendingCashCollection() : Promise.resolve(null),
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
          {isAdmin && (
            <Link href={`/admin/cortes/reporte?mes=${month}`} target="_blank" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
              Reporte mensual
            </Link>
          )}
          <Link
            href="/admin/cortes/nuevo"
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            + Capturar corte
          </Link>
        </div>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Un registro por trabajador y turno.</p>

      {guardado === "1" && (
        <>
          <p className="mt-4 rounded-xl bg-admin-ok-bg px-4 py-3 text-[0.85rem] font-semibold text-admin-ok-text">✓ Corte guardado correctamente.</p>
          {/* Ya se guardó bien, así que el borrador local del formulario de captura ya no sirve de nada. */}
          <script dangerouslySetInnerHTML={{ __html: `try{localStorage.removeItem("farmalem-cutform-draft")}catch(e){}` }} />
        </>
      )}

      {!inRange && <MonthPicker month={month} basePath="/admin/cortes" />}

      <div className="mt-4 rounded-2xl border border-admin-border bg-admin-surface p-4">
        <p className="text-[0.82rem] font-semibold text-admin-ink">
          {inRange ? "Filtrar por rango de fechas" : "O filtra por un rango de fechas específico"}
        </p>
        <DateRangeFilter basePath="/admin/cortes" desde={desde} hasta={hasta} />
      </div>

      <p className="mt-4 text-[0.82rem] font-semibold text-admin-ink">
        {inRange ? `Periodo: ${fmtDate(desde!)} — ${fmtDate(hasta!)}` : `Mes: ${new Date(`${month}-01T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}`}
      </p>

      <section className={`mt-2 grid grid-cols-2 gap-4 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <p className="text-[0.78rem] text-admin-ink-soft">Venta total</p>
          <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-admin-ink">{fmtMoney(totalVentas)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <p className="text-[0.78rem] text-admin-ink-soft">Efectivo</p>
          <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-admin-ink">{fmtMoney(totalEfectivo)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <p className="text-[0.78rem] text-admin-ink-soft">Tarjeta</p>
          <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-admin-ink">{fmtMoney(totalTarjeta)}</p>
        </div>
        <div className="rounded-2xl border border-admin-primary bg-admin-primary-soft p-5">
          <p className="text-[0.78rem] font-semibold text-admin-primary-deep">Efectivo entregado</p>
          <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-admin-ink">{fmtMoney(totalEntregado)}</p>
          <p className="mt-1.5 text-[0.72rem] leading-snug text-admin-ink-soft">
            Lo que debería haber físico en caja de estos cortes (ya con sueldo descontado si se pagó ahí) — súmalo con lo que
            tengas de antes de retirar y así sabes cuánto puedes sacar en{" "}
            <Link href="/admin/salidas/nuevo" className="font-semibold text-admin-primary hover:underline">
              Salidas de efectivo
            </Link>
            .
          </p>
        </div>
        {isAdmin && pendingCash && (
          <div className="rounded-2xl border border-admin-pending-text bg-admin-pending-bg p-5">
            <p className="text-[0.78rem] font-semibold text-admin-pending-text">Efectivo pendiente de recoger</p>
            <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-admin-ink">{fmtMoney(pendingCash.total)}</p>
            <p className="mt-1.5 text-[0.72rem] leading-snug text-admin-ink-soft">
              Suma de todos los cortes ya Aprobados que faltan por marcar &ldquo;Recogido&rdquo; ({pendingCash.count}) — sin importar el mes, es lo que
              debería seguir físicamente en la caja ahorita.
            </p>
          </div>
        )}
      </section>

      <div className="mt-6">
        <CutsList cuts={rows} isAdmin={isAdmin} canReview={canReview} employees={employees.filter((e) => e.role === "employee")} />
      </div>
    </AdminShell>
  );
}
