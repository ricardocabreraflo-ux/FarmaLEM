import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { getOrderById } from "@/lib/orders";

export const metadata: Metadata = { title: "Pago en proceso" };

export default async function CheckoutPendientePage({
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-pale text-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-[clamp(1.6rem,2vw+1rem,2.2rem)] text-ink">Tu pago está en proceso</h1>
        <p className="mt-3 max-w-[48ch] text-ink-soft">
          {order ? `Pedido #${order.id.slice(0, 8).toUpperCase()}. ` : ""}
          Mercado Pago todavía está confirmando tu método de pago — puede tardar unas horas. Te avisamos en
          cuanto se confirme.
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
