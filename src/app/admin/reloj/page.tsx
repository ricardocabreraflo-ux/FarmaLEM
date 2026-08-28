import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { ClockKiosk } from "@/components/admin/ClockKiosk";

export const metadata: Metadata = { title: "Reloj checador" };
export const dynamic = "force-dynamic";

export default async function RelojPage() {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-admin-bg">
      <ClockKiosk />
      <div className="flex flex-col items-center gap-3 pb-10">
        <Link
          href="/admin/cortes/nuevo"
          className="rounded-full bg-admin-primary px-6 py-3 text-[0.9rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Capturar corte
        </Link>
        {session.role === "admin" && (
          <Link href="/admin/reloj/bitacora" className="text-[0.82rem] font-semibold text-admin-primary hover:underline">
            Ver bitácora del día
          </Link>
        )}
      </div>
    </div>
  );
}
