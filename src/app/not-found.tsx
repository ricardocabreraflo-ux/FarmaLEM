import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-[640px] flex-col items-center px-6 py-24 text-center">
        <Image src="/logo.png" alt="" width={72} height={72} className="h-18 w-18 object-contain opacity-90" />
        <p className="mt-6 font-data text-xs font-semibold uppercase tracking-widest text-turquoise-deep">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,2vw+1rem,2.2rem)] text-ink">
          Esta página no la encontramos.
        </h1>
        <p className="mt-3 max-w-[46ch] text-ink-soft">
          Puede que el enlace esté roto o la página ya no exista. Prueba desde el inicio, o
          escríbenos por WhatsApp si buscabas algo en particular.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-blue px-6 py-3.5 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Volver al inicio
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
