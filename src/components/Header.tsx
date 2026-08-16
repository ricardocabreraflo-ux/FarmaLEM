import Image from "next/image";
import { site } from "@/lib/site";

const categorias = [
  "Analgésicos",
  "Antihipertensivos",
  "Gastrointestinales",
  "Respiratorios / Alergias",
  "Vitaminas y Suplementos",
  "Cuidado Personal",
  "Insumos Médicos",
  "Equipo y Botiquín",
  "Promociones",
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface shadow-[0_2px_16px_-8px_rgb(27_39_51_/_0.14)]">
      <div className="bg-blue-deep text-[0.8rem] text-[#E8EEFB]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 py-[7px]">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.4" />
            </svg>
            <span>
              {site.sucursal} &middot; {site.horario}
            </span>
          </div>
          <a href={`tel:+52${site.telefono}`} className="transition-colors hover:text-turquoise">
            Tel. {site.telefonoDisplay}
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-6 py-3.5 lg:flex-nowrap lg:gap-7">
        <a href="#" className="order-1 flex shrink-0 items-center gap-2.5">
          <Image src="/logo.png" alt={site.nombre} width={40} height={40} className="h-10 w-10 object-contain" priority />
          <span className="flex flex-col">
            <span className="font-display text-[1.36rem] font-extrabold leading-none tracking-tight text-blue">
              Farma<span className="text-turquoise-deep">LEM</span>
            </span>
            <span className="text-[0.66rem] text-ink-soft">{site.slogan}</span>
          </span>
        </a>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-2.5 lg:order-3">
          <a
            href={site.tiendaEnLineaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-blue-strong px-3.5 py-2.5 text-[0.86rem] font-semibold whitespace-nowrap text-white transition-transform duration-150 ease-out active:scale-[0.97] lg:px-[18px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
              <path d="M4 4h16l-1.5 9h-13L4 4Z" />
              <path d="M4 4 3 1" />
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            <span className="hidden sm:inline">Comprar en línea</span>
          </a>
          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-turquoise px-3.5 py-2.5 text-[0.86rem] font-semibold whitespace-nowrap text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97] lg:px-[18px]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
              <path d="M12 2C6.5 2 2 6.4 2 11.9c0 1.9.5 3.7 1.5 5.3L2 22l4.9-1.5c1.5.9 3.3 1.4 5.1 1.4 5.5 0 10-4.4 10-9.9C22 6.4 17.5 2 12 2Zm0 18c-1.6 0-3.1-.4-4.4-1.3l-.3-.2-2.9.9.9-2.8-.2-.3C4.4 15 4 13.4 4 11.9 4 7.5 7.6 4 12 4s8 3.5 8 7.9-3.6 8.1-8 8.1Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        <form
          role="search"
          className="order-3 flex w-full items-center gap-2.5 rounded-full border border-line bg-blue-pale px-[18px] py-2.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-blue lg:order-2 lg:max-w-[480px] lg:flex-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[17px] w-[17px] shrink-0 text-ink-soft">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <label htmlFor="site-search" className="sr-only">
            Buscar productos
          </label>
          <input
            id="site-search"
            type="text"
            placeholder="Busca por producto o síntoma, ej. “dolor de cabeza”"
            className="w-full bg-transparent font-body text-[0.92rem] text-ink placeholder:text-ink-soft focus:outline-none"
          />
        </form>
      </div>

      <div className="border-t border-line">
        <nav className="mx-auto flex max-w-[1180px] gap-[22px] overflow-x-auto px-6 py-2.5">
          {categorias.map((cat) => (
            <a
              key={cat}
              href={cat === "Promociones" ? "#promociones" : "#categorias"}
              className="whitespace-nowrap text-[0.87rem] font-medium text-ink-soft transition-colors hover:text-blue"
            >
              {cat}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
