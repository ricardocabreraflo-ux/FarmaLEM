import type { Producto } from "@/lib/productos";

/**
 * Ilustración de reemplazo para producto (no es una foto real). Úsala hasta
 * que existan fotos reales en /public/products — en ese punto, ProductCard
 * puede cambiar a <Image src={producto.imagen} /> sin tocar nada más.
 */
type Variant = "blister" | "bottle" | "syringe" | "mask" | "liquidacion";

function variantFor(producto: Producto): Variant {
  const nombre = producto.nombre.toLowerCase();
  if (producto.promocion.tipo === "liquidacion") return "liquidacion";
  if (nombre.includes("jeringa")) return "syringe";
  if (nombre.includes("cubrebocas")) return "mask";
  if (nombre.includes("soluci") || nombre.includes("jarabe")) return "bottle";
  return "blister";
}

export function ProductArt({ producto }: { producto: Producto }) {
  const variant = variantFor(producto);
  switch (variant) {
    case "bottle":
      return <Bottle />;
    case "syringe":
      return <Syringe />;
    case "mask":
      return <Mask />;
    case "liquidacion":
      return <LiquidacionBox />;
    default:
      return <Blister />;
  }
}

function Blister() {
  return (
    <svg viewBox="0 0 72 60" className="h-[76%] max-w-[72%] drop-shadow-[0_4px_6px_rgb(27_39_51_/_0.22)]">
      <defs>
        <linearGradient id="blisterFoil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-blue)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--color-blue)" stopOpacity="0.65" />
        </linearGradient>
        <radialGradient id="pillG" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="rotate(-7 36 30)">
        <rect x="7" y="9" width="58" height="38" rx="9" fill="url(#blisterFoil)" />
        <g fill="var(--color-blue)" stroke="rgba(255,255,255,0.55)" strokeWidth="1">
          <circle cx="20" cy="20" r="6.4" /><circle cx="36" cy="20" r="6.4" /><circle cx="52" cy="20" r="6.4" />
          <circle cx="20" cy="36" r="6.4" /><circle cx="36" cy="36" r="6.4" /><circle cx="52" cy="36" r="6.4" />
        </g>
        <g fill="url(#pillG)">
          <circle cx="20" cy="20" r="6.4" /><circle cx="36" cy="20" r="6.4" /><circle cx="52" cy="20" r="6.4" />
          <circle cx="20" cy="36" r="6.4" /><circle cx="36" cy="36" r="6.4" /><circle cx="52" cy="36" r="6.4" />
        </g>
        <path d="M7 28h58" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 3" />
        <path d="M23 9v38M39 9v38M55 9v38" stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeDasharray="2 3" />
      </g>
    </svg>
  );
}

function Bottle() {
  return (
    <svg viewBox="0 0 72 60" className="h-[76%] max-w-[72%] drop-shadow-[0_4px_6px_rgb(27_39_51_/_0.22)]">
      <defs>
        <linearGradient id="bottleG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-blue)" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="var(--color-blue)" />
          <stop offset="1" stopColor="var(--color-blue)" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <ellipse cx="36" cy="53" rx="16" ry="3" fill="rgba(27,39,51,0.12)" />
      <rect x="30" y="4" width="12" height="8" rx="2" fill="var(--color-blue)" />
      <path
        d="M25 14h22l3 8v28a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V22Z"
        fill="url(#bottleG)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />
      <rect x="22" y="32" width="28" height="12" fill="rgba(255,255,255,0.85)" />
      <rect x="22" y="35.5" width="28" height="1.4" fill="var(--color-blue)" opacity="0.5" />
      <rect x="22" y="39" width="18" height="1.4" fill="var(--color-blue)" opacity="0.35" />
      <path d="M27 18h6" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Syringe() {
  return (
    <svg viewBox="0 0 72 60" className="h-[76%] max-w-[72%] drop-shadow-[0_4px_6px_rgb(27_39_51_/_0.22)]">
      <defs>
        <linearGradient id="syrG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-turquoise-deep)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--color-turquoise-deep)" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <g transform="rotate(-32 36 30)">
        <rect x="14" y="24" width="34" height="14" rx="2" fill="url(#syrG)" stroke="var(--color-turquoise-deep)" strokeWidth="1.6" />
        <rect x="18" y="27" width="22" height="8" fill="var(--color-turquoise)" opacity="0.55" />
        <rect x="4" y="27" width="10" height="8" rx="1.5" fill="var(--color-turquoise-deep)" />
        <rect x="48" y="28.5" width="14" height="5" fill="var(--color-turquoise-deep)" />
        <rect x="61" y="30" width="7" height="2" fill="var(--color-turquoise-deep)" />
        <rect x="45" y="20" width="4" height="20" fill="var(--color-turquoise-deep)" />
      </g>
    </svg>
  );
}

function Mask() {
  return (
    <svg viewBox="0 0 72 60" className="h-[70%] max-w-[72%] drop-shadow-[0_4px_6px_rgb(27_39_51_/_0.22)]">
      <defs>
        <linearGradient id="maskG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-blue)" />
          <stop offset="1" stopColor="var(--color-blue)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M10 30c0-9 8-16 26-16s26 7 26 16-8 14-26 14-26-5-26-14Z"
        fill="url(#maskG)"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1"
      />
      <path d="M16 24c8 5 32 5 40 0M14 31c9 4 35 4 44 0M17 37c8 4 30 4 38 0" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
      <path d="M10 27C4 24 2 30 6 34" fill="none" stroke="var(--color-blue)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M62 27c6-3 8 3 4 7" fill="none" stroke="var(--color-blue)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function LiquidacionBox() {
  return (
    <svg viewBox="0 0 72 60" className="h-[76%] max-w-[72%] drop-shadow-[0_4px_6px_rgb(27_39_51_/_0.22)]">
      <defs>
        <linearGradient id="liqG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-urgency)" />
          <stop offset="1" stopColor="var(--color-urgency)" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <g transform="rotate(-6 36 30)">
        <rect x="12" y="14" width="48" height="32" rx="4" fill="url(#liqG)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <rect x="12" y="14" width="48" height="9" fill="rgba(255,255,255,0.25)" />
        <text x="36" y="36" fontFamily="var(--font-data)" fontSize="15" fontWeight="700" fill="#fff" textAnchor="middle">
          %
        </text>
      </g>
      <circle cx="58" cy="16" r="9" fill="#fff" />
      <path d="M58 11v6l4 2.2" stroke="var(--color-urgency)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
