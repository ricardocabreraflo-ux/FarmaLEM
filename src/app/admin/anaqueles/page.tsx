import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getShelfAssignment } from "@/lib/anaqueles";
import { mexicoCityToday } from "@/lib/dates";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonthPicker } from "@/components/admin/MonthPicker";
import { AnaquelesOverrideControl } from "@/components/admin/AnaquelesOverrideControl";

export const metadata: Metadata = { title: "Distribución de anaqueles" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function AnaquelesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [profile, assignment] = await Promise.all([getProfileById(session.uid), getShelfAssignment(month)]);

  return (
    <AdminShell activeHref="/admin/anaqueles" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Distribución de anaqueles</h1>
        <Link
          href={`/admin/anaqueles/imprimir?mes=${month}`}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Imprimir
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Quién limpia, revisa medicamento y caducidades en cada anaquel esta semana rola cada mes — se calcula solo
        según el mes sea non o par.
      </p>

      <MonthPicker month={month} basePath="/admin/anaqueles" />

      <h2 className="mt-5 font-display text-lg text-admin-ink">{monthLabel(month)}</h2>
      <div className="mt-2 overflow-hidden rounded-2xl border border-admin-border bg-white">
        <Image src="/anaqueles-croquis.png" alt="Croquis de distribución de anaqueles de FarmaLEM" width={1564} height={1354} className="w-full h-auto" priority />
      </div>

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-admin-border bg-admin-primary-soft p-4">
          <div className="flex items-center gap-2 font-display text-[0.95rem] font-bold text-admin-primary-deep">
            <span className="h-2.5 w-2.5 rounded-full bg-admin-primary" />
            Matutino
          </div>
          <p className="mt-2 font-data text-[0.9rem] leading-relaxed text-admin-ink">
            M{assignment.matutino.nums.join(" · M")}
            <br />
            {assignment.matutino.vitrina}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-amber-soft p-4">
          <div className="flex items-center gap-2 font-display text-[0.95rem] font-bold text-admin-amber">
            <span className="h-2.5 w-2.5 rounded-full bg-admin-amber" />
            Vespertino
          </div>
          <p className="mt-2 font-data text-[0.9rem] leading-relaxed text-admin-ink">
            M{assignment.vespertino.nums.join(" · M")}
            <br />
            {assignment.vespertino.vitrina}
          </p>
        </div>
      </section>

      {session.role === "admin" && (
        <div className="mt-4">
          <AnaquelesOverrideControl month={month} overridden={assignment.overridden} />
        </div>
      )}
    </AdminShell>
  );
}
