import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listCuts, getCutPhotoUrl } from "@/lib/cuts";
import { AdminShell } from "@/components/admin/AdminShell";
import { CutsList } from "@/components/admin/CutsList";

export const metadata: Metadata = { title: "Cortes" };
export const dynamic = "force-dynamic";

export default async function CortesPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";

  const [profile, cuts, employees] = await Promise.all([
    getProfileById(session.uid),
    listCuts(isAdmin ? undefined : session.uid),
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

  return (
    <AdminShell activeHref="/admin/cortes" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Cortes</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/cortes/reporte" target="_blank" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
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

      <div className="mt-6">
        <CutsList cuts={rows} isAdmin={isAdmin} />
      </div>
    </AdminShell>
  );
}
