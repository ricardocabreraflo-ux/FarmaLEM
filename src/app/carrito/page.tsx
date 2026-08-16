import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Tu carrito",
};

export default function CarritoPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-12">
        <h1 className="font-display text-[clamp(1.6rem,2vw+1rem,2.2rem)] text-ink">Tu carrito</h1>
        <div className="mt-8">
          <CartView />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
