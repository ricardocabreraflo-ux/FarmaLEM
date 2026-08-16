import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { getOrderById } from "@/lib/orders";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Pago recibido" };

export default async function CheckoutExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;

  return (
    <>
      <Header />
      <ClearCartOnMount />
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-turquoise-soft text-turquoise-deep">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-8 w-8">
            <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-[clamp(1.6rem,2vw+1rem,2.2rem)] text-ink">¡Gracias, tu pago quedó registrado!</h1>
        <p className="mt-3 max-w-[48ch] text-ink-soft">
          {order
            ? `Pedido #${order.id.slice(0, 8).toUpperCase()} por $${order.total.toFixed(2)}.`
            : "Tu pedido quedó registrado."}{" "}
          Te avisamos por WhatsApp o al teléfono que dejaste cuando esté listo para recoger en {site.sucursal}.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-blue-strong px-6 py-3.5 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Volver al inicio
        </Link>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
