import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireAdminSession } from "@/lib/admin-auth";
import { getShelfAssignment } from "@/lib/anaqueles";
import { mexicoCityToday } from "@/lib/dates";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Imprimir distribución de anaqueles" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function ImprimirAnaquelesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const assignment = await getShelfAssignment(month);

  return (
    <main className="force-light-admin mx-auto max-w-[900px] px-6 py-10 print:px-0 print:py-1">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { margin: 10mm; }
        }
        .force-light-admin {
          --admin-bg: #f3f6f4;
          --admin-surface: #ffffff;
          --admin-border: rgb(23 33 27 / 0.12);
          --admin-ink: #17211b;
          --admin-ink-soft: #59665d;
          --admin-primary: #176b46;
          --admin-primary-deep: #0f4d33;
          --admin-primary-soft: #e8f1ec;
          --admin-amber: #b5720a;
          --admin-amber-soft: #fbeed9;
          background: var(--admin-bg);
          color: var(--admin-ink);
        }
      `}</style>

      <Link href={`/admin/anaqueles?mes=${month}`} className="text-[0.85rem] font-semibold text-admin-primary print:hidden">
        &larr; Volver
      </Link>
      <div className="mt-2 flex items-center justify-between print:mt-0">
        <h1 className="font-display text-xl text-admin-ink print:text-[1.05rem]">FarmaLEM &middot; Distribución de anaqueles &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-admin-border print:mt-3 print:rounded-none print:border-0">
        <Image src="/anaqueles-croquis.png" alt="Croquis de distribución de anaqueles de FarmaLEM" width={1564} height={1354} className="w-full h-auto" priority />
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3 print:mt-3">
        <div className="rounded-xl border border-admin-border bg-admin-primary-soft p-4 print:break-inside-avoid">
          <div className="font-display text-[0.95rem] font-bold text-admin-primary-deep">Matutino</div>
          <p className="mt-1.5 font-data text-[0.9rem] leading-relaxed text-admin-ink">
            M{assignment.matutino.nums.join(" · M")}
            <br />
            {assignment.matutino.vitrina}
          </p>
        </div>
        <div className="rounded-xl border border-admin-border bg-admin-amber-soft p-4 print:break-inside-avoid">
          <div className="font-display text-[0.95rem] font-bold text-admin-amber">Vespertino</div>
          <p className="mt-1.5 font-data text-[0.9rem] leading-relaxed text-admin-ink">
            M{assignment.vespertino.nums.join(" · M")}
            <br />
            {assignment.vespertino.vitrina}
          </p>
        </div>
      </section>
    </main>
  );
}
