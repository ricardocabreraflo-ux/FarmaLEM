import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listHistory } from "@/lib/history";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Historial" };
export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const session = await requireAdminSession();
  const [profile, entries, employees] = await Promise.all([getProfileById(session.uid), listHistory(), listProfiles()]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  return (
    <AdminShell activeHref="/admin/historial" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Historial</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Registro de quién realizó cada movimiento.</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-5 py-3 font-medium">Fecha y hora</th>
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Acción</th>
                <th className="px-5 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-admin-ink-soft">
                    Sin movimientos registrados todavía.
                  </td>
                </tr>
              )}
              {entries.map((h) => (
                <tr key={h.id} className="border-b border-admin-border last:border-0">
                  <td className="px-5 py-3 text-admin-ink-soft">{new Date(h.created_at).toLocaleString("es-MX")}</td>
                  <td className="px-5 py-3 font-semibold text-admin-ink">{h.user_id ? nameById.get(h.user_id) ?? "Desconocido" : "—"}</td>
                  <td className="px-5 py-3 text-admin-ink">{h.action}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{h.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
