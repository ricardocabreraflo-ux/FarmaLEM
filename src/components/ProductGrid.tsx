import { getGondolas, type Gondola } from "@/lib/productos";
import { PromoCard } from "./PromoCard";
import { Reveal } from "./Reveal";
import { site } from "@/lib/site";

const SHELF_HEADER_BG: Record<Gondola["tipo"], string> = {
  "3x2": "bg-gradient-to-r from-blue-deep to-blue",
  "5x4": "bg-gradient-to-r from-turquoise-deep to-turquoise",
  liquidacion: "bg-gradient-to-r from-[#7a2620] to-urgency",
};

const SHELF_BADGE_STYLE: Record<Gondola["tipo"], string> = {
  "3x2": "bg-turquoise text-[#06322F]",
  "5x4": "bg-[#06322F] text-turquoise",
  liquidacion: "bg-white text-urgency",
};

const SHELF_BADGE_LABEL: Record<Gondola["tipo"], string> = {
  "3x2": "3X2",
  "5x4": "5X4",
  liquidacion: "-30/-40/-50%",
};

export function ProductGrid() {
  const gondolas = getGondolas();

  return (
    <section id="promociones" className="py-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-data text-xs font-semibold uppercase tracking-widest text-turquoise-deep">
              Góndola de ofertas
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,1.6vw+1rem,2rem)] text-ink">
              Promociones activas
            </h2>
            <p className="mt-2 max-w-[56ch] text-sm text-ink-soft">
              Organizadas como en la farmacia: cada franja de color es un pasillo. Los
              precios y el catálogo salen de un solo archivo de datos — se actualizan sin
              tocar el diseño.
            </p>
          </div>
        </div>

        {gondolas.map((gondola) => (
          <Reveal key={gondola.grupo} className="mb-5 overflow-hidden rounded-[22px] border border-line bg-surface shadow-card">
            <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 ${SHELF_HEADER_BG[gondola.tipo]}`}>
              <div className="flex items-center gap-3.5">
                <span className={`rounded-[10px] px-3.5 py-1.5 font-data text-base font-bold tracking-wide ${SHELF_BADGE_STYLE[gondola.tipo]}`}>
                  {SHELF_BADGE_LABEL[gondola.tipo]}
                </span>
                <h3 className="font-display text-[1.05rem] text-white">{gondola.grupo}</h3>
              </div>
              <span className="font-data text-xs text-white/80">
                {gondola.tipo === "liquidacion" ? "¡Últimas piezas!" : `${gondola.productos.length} productos en promoción`}
              </span>
            </div>
            {gondola.tipo === "liquidacion" && (
              <p className="border-b border-line px-6 pb-4 pt-1 text-[0.84rem] italic text-ink-soft">
                Estructura de ejemplo — sustituye estas tarjetas con tu lista real de
                productos próximos a caducar y su descuento.
              </p>
            )}
            <div className="promo-row grid auto-cols-[minmax(216px,1fr)] grid-flow-col gap-4 overflow-x-auto px-6 py-5">
              {gondola.productos.map((producto) => (
                <PromoCard key={producto.id} producto={producto} />
              ))}
            </div>
          </Reveal>
        ))}

        <Reveal className="mt-2 flex flex-wrap items-center justify-between gap-6 rounded-[22px] border border-line bg-gradient-to-br from-blue-pale to-turquoise-soft p-8">
          <div>
            <p className="font-data text-xs font-semibold uppercase tracking-widest text-turquoise-deep">
              Precios e inventario en tiempo real
            </p>
            <h3 className="mt-1.5 font-display text-xl text-ink">¿Ya sabes qué necesitas? Pídelo en línea.</h3>
            <p className="mt-2 max-w-[52ch] text-[0.86rem] text-ink-soft">
              Estas tarjetas muestran el catálogo y las promociones. Para apartar o pagar
              tu pedido con existencia real, entra a nuestra tienda en línea.
            </p>
          </div>
          <a
            href={site.tiendaEnLineaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-turquoise px-6 py-3.5 font-bold text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Ir a la tienda en línea
          </a>
        </Reveal>
      </div>
    </section>
  );
}
