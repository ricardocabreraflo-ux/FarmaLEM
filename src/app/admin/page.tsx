import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";
import { OrdersList } from "@/components/admin/OrdersList";
import { logout } from "./login/actions";

export const metadata: Metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }

  let orders;
  try {
    orders = await listOrders();
  } catch (err) {
    return (
      <main className="mx-auto min-h-screen max-w-[900px] px-6 py-10">
        <h1 className="font-display text-2xl text-ink">Pedidos</h1>
        <p className="mt-4 rounded-2xl border border-line bg-urgency-soft p-6 text-urgency-strong">
          No se pudieron cargar los pedidos: {err instanceof Error ? err.message : "error desconocido"}
        </p>
      </main>
    );
  }

  const pendientes = orders.filter((o) => o.status === "pagado" || o.status === "listo_para_recoger");
  const resto = orders.filter((o) => o.status !== "pagado" && o.status !== "listo_para_recoger");

  return (
    <main className="mx-auto min-h-screen max-w-[900px] px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Pedidos</h1>
        <form action={logout}>
          <button type="submit" className="text-[0.85rem] font-semibold text-ink-soft hover:text-blue">
            Cerrar sesión
          </button>
        </form>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink">Por atender</h2>
        <div className="mt-3">
          <OrdersList orders={pendientes} />
        </div>
      </section>

      {resto.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg text-ink">Historial</h2>
          <div className="mt-3">
            <OrdersList orders={resto} />
          </div>
        </section>
      )}
    </main>
  );
}
