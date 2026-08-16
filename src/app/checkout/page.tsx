import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-12">
        <h1 className="font-display text-[clamp(1.6rem,2vw+1rem,2.2rem)] text-ink">Finalizar pedido</h1>
        <p className="mt-2 max-w-[60ch] text-ink-soft">
          Pagas en línea con Mercado Pago y pasas a recoger tu pedido a la sucursal.
        </p>
        <div className="mt-8">
          <CheckoutForm />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
