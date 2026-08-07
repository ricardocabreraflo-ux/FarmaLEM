import type { Producto } from "@/lib/productos";
import { ProductArt } from "./ProductArt";

const PROMO_LABEL: Record<string, string> = {
  "3x2": "3X2",
  "5x4": "5X4",
};

const SWATCH_BG: Record<string, string> = {
  "3x2": "bg-gradient-to-br from-blue-pale to-surface",
  "5x4": "bg-gradient-to-br from-turquoise-soft to-surface",
  liquidacion: "bg-gradient-to-br from-urgency-soft to-surface",
};

const CHIP_STYLE: Record<string, string> = {
  "3x2": "bg-turquoise-soft text-turquoise-deep",
  "5x4": "bg-turquoise-soft text-turquoise-deep",
  liquidacion: "bg-urgency text-white",
};

export function PromoCard({ producto }: { producto: Producto }) {
  const { tipo, descuento } = producto.promocion;
  const chipLabel = tipo === "liquidacion" ? `-${descuento}%` : PROMO_LABEL[tipo];
  const isLiquidacion = tipo === "liquidacion";

  return (
    <article className="promo-card group relative flex w-56 shrink-0 flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_22px_-18px_rgb(27_39_51_/_0.35)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-1 hover:shadow-card">
      <div className={`relative flex h-20 items-center justify-center overflow-hidden rounded-xl ${SWATCH_BG[tipo]}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_0%,rgba(255,255,255,0.65),rgba(255,255,255,0)_60%)]" />
        <ProductArt producto={producto} />
      </div>
      <span
        className={`absolute right-3 top-3 rounded-md px-2 py-0.5 font-data text-[0.66rem] font-bold tracking-wide ${CHIP_STYLE[tipo]} ${isLiquidacion ? "motion-safe:animate-badge-pulse" : ""}`}
      >
        {chipLabel}
      </span>
      <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-ink-soft">{producto.marca}</span>
      <h4 className="-mt-1.5 font-body text-[0.98rem] font-bold text-ink">{producto.nombre}</h4>
      <span className="font-data text-[0.72rem] text-ink-soft">{producto.sustanciaActiva.toUpperCase()}</span>
      <p className="grow text-[0.8rem] text-ink-soft">{producto.descripcionUso}</p>
      <div className="mt-auto flex items-baseline justify-between border-t border-dashed border-line pt-2.5">
        <span className="font-data text-[1.1rem] font-bold tabular-nums text-ink">
          {producto.precio > 0 ? `$${producto.precio.toFixed(2)}` : "$XX.XX"}
        </span>
        <span className="text-[0.68rem] text-ink-soft">c/u</span>
      </div>
    </article>
  );
}
