import type { Metadata } from "next";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listOrders } from "@/lib/orders";
import { OrdersList } from "@/components/admin/OrdersList";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession();
  const profile = await getProfileById(session.uid);

  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  let loadError: string | null = null;
  try {
    orders = await listOrders();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "error desconocido";
  }

  const pendientes = orders.filter((o) => o.status === "pagado" || o.status === "listo_para_recoger");
  const resto = orders.filter((o) => o.status !== "pagado" && o.status !== "listo_para_recoger");

  return (
    <AdminShell activeHref="/admin" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Pedidos</h1>

      {loadError ? (
        <p className="mt-4 rounded-2xl border border-admin-border bg-admin-bad-bg p-6 text-admin-bad-text">
          No se pudieron cargar los pedidos: {loadError}
        </p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="font-display text-lg text-admin-ink">Por atender</h2>
            <div className="mt-3">
              <OrdersList orders={pendientes} />
            </div>
          </section>

          {resto.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-lg text-admin-ink">Historial</h2>
              <div className="mt-3">
                <OrdersList orders={resto} />
              </div>
            </section>
          )}
        </>
      )}
    </AdminShell>
  );
}
