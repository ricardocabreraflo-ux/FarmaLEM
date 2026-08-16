import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "No se pudo procesar el pago" };

export default function CheckoutErrorPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-urgency-soft text-urgency-strong">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
            <path d="M12 8v5M12 16.2v.2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-[clamp(1.6rem,2vw+1rem,2.2rem)] text-ink">No se pudo procesar tu pago</h1>
        <p className="mt-3 max-w-[48ch] text-ink-soft">
          Mercado Pago rechazó el pago o cancelaste el proceso. Tu carrito sigue guardado — puedes intentar de
          nuevo o escribirnos si el problema sigue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="rounded-full bg-blue-strong px-6 py-3.5 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Intentar de nuevo
          </Link>
          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-turquoise px-6 py-3.5 font-bold text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
