import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, getActiveEmployeeByShift, type Profile } from "@/lib/profiles";
import { listAttendanceForRange } from "@/lib/attendance";
import { computeWeekFromRecords, listBonusTiers, tierProgress, type BonusTier } from "@/lib/bonuses";
import { listCutsForMonth, type Cut } from "@/lib/cuts";
import { listOrders } from "@/lib/orders";
import { lastEventToday, mexicoCityToday, type TimeClockEvent } from "@/lib/time-clock";
import { addDays, mondayOf } from "@/lib/dates";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["Asistió", "Cubrió turno"]);
const SHIFTS = ["Matutino", "Vespertino"] as const;

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

interface Tiers {
  ordered: BonusTier[];
  currentTier: BonusTier | null;
  nextTier: BonusTier | null;
}

function GoalNote({ sales, tiers }: { sales: number; tiers: Tiers }) {
  if (tiers.ordered.length === 0) return <>Aún no hay metas configuradas para este turno este mes.</>;
  if (tiers.nextTier) {
    return (
      <>
        Faltan <b className="font-data text-admin-primary-deep">{fmtMoney(tiers.nextTier.goal - sales)}</b> para el Nivel {tiers.nextTier.level} y un bono de{" "}
        <b className="font-data text-admin-primary-deep">{fmtMoney(tiers.nextTier.bonus)}</b>.
      </>
    );
  }
  return (
    <>
      ¡Nivel máximo de la semana alcanzado! Bono actual: <b className="font-data text-admin-primary-deep">{fmtMoney(tiers.currentTier?.bonus ?? 0)}</b>.
    </>
  );
}

function Ladder({ sales, tiers }: { sales: number; tiers: Tiers }) {
  if (tiers.ordered.length === 0) return null;
  return (
    <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiers.ordered.map((tier) => {
        const reached = sales >= tier.goal;
        const isCurrentTarget = !reached && tier.id === tiers.nextTier?.id;
        return (
          <div
            key={tier.id}
            className={`rounded-xl border p-2.5 text-center ${
              reached ? "border-transparent bg-admin-ok-bg text-admin-ok-text" : isCurrentTarget ? "border-2 border-admin-primary text-admin-ink" : "border-admin-border text-admin-ink"
            }`}
          >
            <div className="text-[0.7rem] font-bold uppercase tracking-wide opacity-80">Nivel {tier.level}</div>
            <div className="mt-0.5 font-data text-[0.82rem] font-bold tabular-nums">{fmtMoney(tier.goal)}</div>
            <div className="text-[0.72rem] opacity-75">+{fmtMoney(tier.bonus)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default async function InicioPage() {
  const session = await requireSession();
  return session.role === "admin" ? <AdminInicio uid={session.uid} role={session.role} /> : <EmployeeInicio uid={session.uid} role={session.role} />;
}

async function EmployeeInicio({ uid, role }: { uid: string; role: "admin" | "employee" }) {
  const today = mexicoCityToday();
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);

  const [profile, last, weekSales, bonusTiers, weekAttendance] = await Promise.all([
    getProfileById(uid),
    lastEventToday(uid),
    computeWeekFromRecords(uid, monday, sunday),
    listBonusTiers(today.slice(0, 7)),
    listAttendanceForRange(monday, sunday),
  ]);

  const shift = profile?.shift ?? "";
  const tiers = tierProgress(weekSales.sales, shift, bonusTiers);
  const daysWorked = weekAttendance.filter((a) => a.employee_id === uid && PAID_STATUSES.has(a.status)).length;
  const barGoal = tiers.nextTier?.goal ?? tiers.currentTier?.goal ?? Math.max(weekSales.sales, 1);
  const barPct = Math.min(100, Math.round((weekSales.sales / barGoal) * 100));

  return (
    <AdminShell activeHref="/admin/inicio" userName={profile?.full_name ?? "Sin nombre"} userRole={role}>
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
              {tiers.nextTier && <span className="text-admin-ink-soft">de {fmtMoney(tiers.nextTier.goal)}</span>}
            </div>
          </div>
          {tiers.currentTier && (
            <span className="rounded-full bg-admin-ok-bg px-3 py-1.5 text-[0.78rem] font-bold text-admin-ok-text">Nivel {tiers.currentTier.level} alcanzado</span>
          )}
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-admin-bg">
          <div className="h-full rounded-full bg-admin-primary transition-[width]" style={{ width: `${barPct}%` }} />
        </div>

        <p className="mt-2.5 text-[0.88rem] text-admin-ink-soft">
          <GoalNote sales={weekSales.sales} tiers={tiers} />
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
          <Link href="/admin/cortes/nuevo" className="rounded-full border border-admin-border px-6 py-3 text-[0.9rem] font-semibold text-admin-ink">
            Capturar corte
          </Link>
        </div>
      </section>

      {tiers.ordered.length > 0 && (
        <section className="mt-4 rounded-2xl border border-admin-border bg-admin-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base text-admin-ink">Niveles de bono &middot; {shift}</h2>
            <span className="text-[0.82rem] text-admin-ink-soft">{tiers.currentTier ? `Vas en el Nivel ${tiers.currentTier.level}` : "Aún sin nivel alcanzado"}</span>
          </div>
          <Ladder sales={weekSales.sales} tiers={tiers} />
        </section>
      )}
    </AdminShell>
  );
}

interface ShiftSnapshot {
  shift: string;
  employee: Profile | null;
  sales: number;
  tiers: Tiers;
  last: TimeClockEvent | null;
  todaysCut: Cut | null;
}

async function loadShiftSnapshot(shift: string, monday: string, sunday: string, bonusTiers: BonusTier[], todaysCuts: Cut[]): Promise<ShiftSnapshot> {
  const employee = await getActiveEmployeeByShift(shift);
  if (!employee) return { shift, employee: null, sales: 0, tiers: { ordered: [], currentTier: null, nextTier: null }, last: null, todaysCut: null };

  const [weekSales, last] = await Promise.all([computeWeekFromRecords(employee.id, monday, sunday), lastEventToday(employee.id)]);
  const tiers = tierProgress(weekSales.sales, shift, bonusTiers);
  const todaysCut = todaysCuts.find((c) => c.shift === shift) ?? null;
  return { shift, employee, sales: weekSales.sales, tiers, last, todaysCut };
}

function ShiftCard({ snapshot }: { snapshot: ShiftSnapshot }) {
  const { shift, employee, sales, tiers, last, todaysCut } = snapshot;
  if (!employee) {
    return (
      <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
        <span className="text-[0.78rem] font-bold uppercase tracking-wide text-admin-ink-soft">{shift}</span>
        <p className="mt-2 text-[0.86rem] text-admin-ink-soft">Sin empleada asignada a este turno.</p>
      </div>
    );
  }

  const barGoal = tiers.nextTier?.goal ?? tiers.currentTier?.goal ?? Math.max(sales, 1);
  const barPct = Math.min(100, Math.round((sales / barGoal) * 100));

  return (
    <div className="rounded-2xl border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[0.78rem] font-bold uppercase tracking-wide text-admin-ink-soft">
            {shift} &middot; {employee.full_name}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-[1.5rem] font-extrabold text-admin-ink">{fmtMoney(sales)}</span>
            {tiers.nextTier && <span className="text-[0.82rem] text-admin-ink-soft">de {fmtMoney(tiers.nextTier.goal)}</span>}
          </div>
        </div>
        {tiers.currentTier && (
          <span className="rounded-full bg-admin-ok-bg px-2.5 py-1 text-[0.74rem] font-bold text-admin-ok-text">Nivel {tiers.currentTier.level}</span>
        )}
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-admin-bg">
        <div className="h-full rounded-full bg-admin-primary transition-[width]" style={{ width: `${barPct}%` }} />
      </div>

      <p className="mt-2 text-[0.82rem] text-admin-ink-soft">
        <GoalNote sales={sales} tiers={tiers} />
      </p>
      {todaysCut?.status === "Por revisar" && (
        <p className="mt-1 text-[0.82rem] text-admin-pending-text">
          El corte de hoy ({fmtMoney(todaysCut.total)}) todavía no cuenta aquí — falta{" "}
          <Link href="/admin/cortes" className="font-semibold underline">
            aprobarlo en Cortes
          </Link>
          .
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[0.78rem]">
        <span className="rounded-full border border-admin-border px-2.5 py-1 text-admin-ink-soft">
          {last ? `${last.event_type} · ${fmtTime(last.occurred_at)}` : "Sin marcar hoy"}
        </span>
        {!todaysCut && <span className="rounded-full bg-admin-pending-bg px-2.5 py-1 font-semibold text-admin-pending-text">Corte de hoy pendiente</span>}
        {todaysCut?.status === "Aprobado" && <span className="rounded-full bg-admin-ok-bg px-2.5 py-1 font-semibold text-admin-ok-text">Corte de hoy aprobado</span>}
        {todaysCut?.status === "Por revisar" && (
          <Link href="/admin/cortes" className="rounded-full bg-admin-pending-bg px-2.5 py-1 font-semibold text-admin-pending-text">
            Corte de hoy sin aprobar
          </Link>
        )}
        {todaysCut?.status === "Rechazado" && <span className="rounded-full bg-admin-bad-bg px-2.5 py-1 font-semibold text-admin-bad-text">Corte de hoy rechazado</span>}
      </div>

      <Ladder sales={sales} tiers={tiers} />
    </div>
  );
}

async function AdminInicio({ uid, role }: { uid: string; role: "admin" | "employee" }) {
  const today = mexicoCityToday();
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);
  const month = today.slice(0, 7);

  const [profile, bonusTiers, monthCuts, orders] = await Promise.all([getProfileById(uid), listBonusTiers(month), listCutsForMonth(month), listOrders()]);
  const todaysCuts = monthCuts.filter((c) => c.cut_date === today);
  const pendingOrders = orders.filter((o) => o.status === "pagado" || o.status === "listo_para_recoger").length;
  const ventasHoy = todaysCuts.filter((c) => c.status === "Aprobado").reduce((sum, c) => sum + c.total, 0);
  const ventasHoySinAprobar = todaysCuts.filter((c) => c.status === "Por revisar").reduce((sum, c) => sum + c.total, 0);

  const [matutino, vespertino] = await Promise.all(SHIFTS.map((shift) => loadShiftSnapshot(shift, monday, sunday, bonusTiers, todaysCuts)));

  return (
    <AdminShell activeHref="/admin/inicio" userName={profile?.full_name ?? "Sin nombre"} userRole={role}>
      <h1 className="font-display text-2xl text-admin-ink">Inicio</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Vista global &middot; {rangeLabel(monday, sunday)}</p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Pedidos pendientes</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{pendingOrders}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Ventas de hoy (aprobadas)</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(ventasHoy)}</p>
          {ventasHoySinAprobar > 0 && (
            <Link href="/admin/cortes" className="mt-0.5 block text-[0.76rem] font-semibold text-admin-pending-text hover:underline">
              + {fmtMoney(ventasHoySinAprobar)} sin aprobar
            </Link>
          )}
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Cortes capturados hoy</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{todaysCuts.length} de 2</p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ShiftCard snapshot={matutino} />
        <ShiftCard snapshot={vespertino} />
      </section>

      <section className="mt-4 rounded-2xl border border-admin-border bg-admin-surface p-5">
        <h2 className="font-display text-base text-admin-ink">Accesos directos</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Pedidos
          </Link>
          <Link href="/admin/cortes" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Cortes
          </Link>
          <Link href="/admin/asistencia" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Asistencia
          </Link>
          <Link href="/admin/reloj/semana" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Reporte semanal de entradas
          </Link>
          <Link href="/admin/sueldos" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Sueldos y salarios
          </Link>
          <Link
            href="/admin/sueldos/comprobante-semanal"
            className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary"
          >
            Comprobante semanal
          </Link>
          <Link href="/admin/ventas" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Comparativa de ventas
          </Link>
          <Link href="/admin/reloj/bitacora" className="rounded-xl border border-admin-border p-3 text-center text-[0.85rem] font-semibold text-admin-ink hover:border-admin-primary">
            Bitácora del reloj checador
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
