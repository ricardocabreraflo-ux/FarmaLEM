import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listAttendanceForRange } from "@/lib/attendance";
import { computeWeekFromRecords, listBonusTiers, tierProgress } from "@/lib/bonuses";
import { lastEventToday, mexicoCityToday } from "@/lib/time-clock";
import { addDays, mondayOf } from "@/lib/dates";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

function rangeLabel(monday: string, sunday: string) {
  const start = new Date(`${monday}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  const end = new Date(`${sunday}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  return `${start} al ${end}`;
}

export default async function InicioPage() {
  const session = await requireSession();
  const today = mexicoCityToday();
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);

  const [profile, last, weekSales, tiers, weekAttendance] = await Promise.all([
    getProfileById(session.uid),
    lastEventToday(session.uid),
    computeWeekFromRecords(session.uid, monday, sunday),
    listBonusTiers(today.slice(0, 7)),
    listAttendanceForRange(monday, sunday),
  ]);

  const shift = profile?.shift ?? "";
  const { ordered, currentTier, nextTier } = tierProgress(weekSales.sales, shift, tiers);
  const daysWorked = weekAttendance.filter((a) => a.employee_id === session.uid && PAID_STATUSES.has(a.status)).length;
  const barGoal = nextTier?.goal ?? currentTier?.goal ?? Math.max(weekSales.sales, 1);
  const barPct = Math.min(100, Math.round((weekSales.sales / barGoal) * 100));

  return (
    <AdminShell activeHref="/admin/inicio" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Inicio</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Hola, {profile?.full_name ?? ""} &middot; Turno {shift}
      </p>

      <section className="mt-5 rounded-2xl border border-admin-border bg-admin-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-[0.78rem] font-bold uppercase tracking-wide text-admin-ink-soft">Meta de la semana &middot; {rangeLabel(monday, sunday)}</span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-display text-[2.1rem] font-extrabold text-admin-ink">{fmtMoney(weekSales.sales)}</span>
              {nextTier && <span className="text-admin-ink-soft">de {fmtMoney(nextTier.goal)}</span>}
            </div>
          </div>
          {currentTier && (
            <span className="rounded-full bg-admin-ok-bg px-3 py-1.5 text-[0.78rem] font-bold text-admin-ok-text">Nivel {currentTier.level} alcanzado</span>
          )}
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-admin-bg">
          <div className="h-full rounded-full bg-admin-primary transition-[width]" style={{ width: `${barPct}%` }} />
        </div>

        <p className="mt-2.5 text-[0.88rem] text-admin-ink-soft">
          {ordered.length === 0 ? (
            "Aún no hay metas configuradas para tu turno este mes."
          ) : nextTier ? (
            <>
              Te faltan <b className="font-data text-admin-primary-deep">{fmtMoney(nextTier.goal - weekSales.sales)}</b> para el Nivel {nextTier.level} y un bono de{" "}
              <b className="font-data text-admin-primary-deep">{fmtMoney(nextTier.bonus)}</b>.
            </>
          ) : (
            <>¡Alcanzaste el nivel máximo de la semana! Bono actual: <b className="font-data text-admin-primary-deep">{fmtMoney(currentTier?.bonus ?? 0)}</b>.</>
          )}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-admin-border bg-admin-bg/60 px-4 py-3">
            <span className="text-[0.78rem] text-admin-ink-soft">Última marca</span>
            <p className="mt-0.5 font-display font-semibold text-admin-ink">{last ? `${last.event_type} · ${fmtTime(last.occurred_at)}` : "Aún no marcas hoy"}</p>
          </div>
          <div className="rounded-xl border border-admin-border bg-admin-bg/60 px-4 py-3">
            <span className="text-[0.78rem] text-admin-ink-soft">Días trabajados esta semana</span>
            <p className="mt-0.5 font-display font-semibold text-admin-ink">{daysWorked}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/reloj"
            className="rounded-full bg-admin-primary px-6 py-3 text-[0.9rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Ir al reloj checador
          </Link>
          <Link
            href="/admin/cortes/nuevo"
            className="rounded-full border border-admin-border px-6 py-3 text-[0.9rem] font-semibold text-admin-ink"
          >
            Capturar corte
          </Link>
        </div>
      </section>

      {ordered.length > 0 && (
        <section className="mt-4 rounded-2xl border border-admin-border bg-admin-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base text-admin-ink">Niveles de bono &middot; {shift}</h2>
            <span className="text-[0.82rem] text-admin-ink-soft">{currentTier ? `Vas en el Nivel ${currentTier.level}` : "Aún sin nivel alcanzado"}</span>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ordered.map((tier) => {
              const reached = weekSales.sales >= tier.goal;
              const isCurrentTarget = !reached && tier.id === nextTier?.id;
              return (
                <div
                  key={tier.id}
                  className={`rounded-xl border p-3 text-center ${
                    reached
                      ? "border-transparent bg-admin-ok-bg text-admin-ok-text"
                      : isCurrentTarget
                        ? "border-2 border-admin-primary text-admin-ink"
                        : "border-admin-border text-admin-ink"
                  }`}
                >
                  <div className="text-[0.72rem] font-bold uppercase tracking-wide opacity-80">Nivel {tier.level}</div>
                  <div className="mt-0.5 font-data text-[0.86rem] font-bold tabular-nums">{fmtMoney(tier.goal)}</div>
                  <div className="text-[0.74rem] opacity-75">+{fmtMoney(tier.bonus)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
