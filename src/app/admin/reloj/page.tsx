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
      {session.role === "admin" && (
        <p className="pb-8 text-center">
          <Link href="/admin/reloj/bitacora" className="text-[0.82rem] font-semibold text-admin-primary hover:underline">
            Ver bitácora del día
          </Link>
        </p>
      )}
    </div>
  );
}
