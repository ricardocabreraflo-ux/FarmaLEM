import Image from "next/image";
import { site } from "@/lib/site";

const categoriasA = ["Analgésicos", "Antihipertensivos", "Gastrointestinales", "Respiratorios / Alergias"];
const categoriasB = ["Vitaminas y Suplementos", "Cuidado Personal", "Insumos Médicos", "Equipo y Botiquín"];

export function Footer() {
  return (
    <footer className="bg-blue-deep pt-13 text-[#C9D6EF]">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-white/14 pb-9 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt={site.nombre} width={34} height={34} className="h-8.5 w-8.5 object-contain" />
              <span className="font-display text-[1.36rem] font-extrabold leading-none tracking-tight text-white">
                Farma<span className="text-turquoise">LEM</span>
              </span>
            </div>
            <p className="mt-2.5 max-w-[30ch] text-[0.86rem] text-[#AFC1E6]">{site.slogan}.</p>
          </div>

          <FooterList title="Categorías" items={categoriasA} />
          <FooterList title="Más categorías" items={categoriasB} />

          <div>
            <h5 className="mb-3.5 text-[0.82rem] font-medium uppercase tracking-wide text-white">Farmacia</h5>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href={site.tiendaEnLineaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.85rem] text-[#C9D6EF] transition-colors hover:text-turquoise"
                >
                  Tienda en línea (pedidos)
                </a>
              </li>
              <li>
                <a href="#promociones" className="text-[0.85rem] text-[#C9D6EF] transition-colors hover:text-turquoise">
                  Promociones activas
                </a>
              </li>
              <li>
                <a href="#ubicacion" className="text-[0.85rem] text-[#C9D6EF] transition-colors hover:text-turquoise">
                  Ubicación y horario
                </a>
              </li>
            </ul>

            <div className="mt-4 flex gap-2.5">
              <a
                href={site.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.92]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.25 w-4.25">
                  <path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1Z" />
                </svg>
              </a>
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_110%,#FFD776_0%,#F1544A_26%,#D42E81_48%,#8134AF_68%,#4A63D3_100%)] text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.92]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4.25 w-4.25">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1" />
                </svg>
              </a>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-turquoise text-[#06322F] transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.92]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.25 w-4.25">
                  <path d="M12 2C6.5 2 2 6.4 2 11.9c0 1.9.5 3.7 1.5 5.3L2 22l4.9-1.5c1.5.9 3.3 1.4 5.1 1.4 5.5 0 10-4.4 10-9.9C22 6.4 17.5 2 12 2Zm0 18c-1.6 0-3.1-.4-4.4-1.3l-.3-.2-2.9.9.9-2.8-.2-.3C4.4 15 4 13.4 4 11.9 4 7.5 7.6 4 12 4s8 3.5 8 7.9-3.6 8.1-8 8.1Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-5.5">
          <p className="max-w-[62ch] text-[0.72rem] leading-relaxed text-[#90A4CE]">{site.avisoLegal}</p>
          <span className="font-data text-xs text-[#7FE6DF]">&copy; {new Date().getFullYear()} FarmaLEM</span>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5 className="mb-3.5 text-[0.82rem] font-medium uppercase tracking-wide text-white">{title}</h5>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item}>
            <a href="#categorias" className="text-[0.85rem] text-[#C9D6EF] transition-colors hover:text-turquoise">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
