export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(150deg,var(--color-blue-deep)_0%,var(--color-blue)_62%,var(--color-turquoise-deep)_100%)] text-white">
      <div
        aria-hidden
        className="motion-safe:animate-blob-1 absolute -right-20 -top-45 z-[1] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0))] blur-[60px]"
      />
      <div
        aria-hidden
        className="motion-safe:animate-blob-2 absolute -bottom-55 left-[8%] z-[1] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1),rgba(255,255,255,0))] blur-[60px]"
      />

      <div className="relative z-[2] mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-6 pb-14 pt-[68px] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="motion-safe:animate-fade-up font-data text-xs font-semibold uppercase tracking-widest text-[#BFE9E5]">
            Promoción de la semana
          </p>
          <h1
            className="motion-safe:animate-fade-up mt-3.5 text-[clamp(2.1rem,3.6vw+1rem,3.2rem)] leading-[1.08] tracking-tight"
            style={{ animationDelay: "0.05s", animationFillMode: "both" }}
          >
            Tu salud, con precios claros y gente que sí te conoce.
          </h1>
          <p
            className="motion-safe:animate-fade-up mt-4 max-w-[46ch] text-[1.05rem] text-[#E4ECFB]"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            3X2 en analgésicos, antihipertensivos, gastrointestinales y respiratorios. Sin
            letras chiquitas, sin sorpresas en la caja.
          </p>
          <div
            className="motion-safe:animate-fade-up mt-7.5 flex flex-wrap gap-3"
            style={{ animationDelay: "0.15s", animationFillMode: "both" }}
          >
            <a
              href="#promociones"
              className="rounded-full bg-turquoise px-6.5 py-3.5 text-[0.95rem] font-bold text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Ver promociones activas
            </a>
            <a
              href="#ubicacion"
              className="rounded-full border border-white/35 bg-white/10 px-6.5 py-3.5 text-[0.95rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Encuentra tu sucursal
            </a>
          </div>
          <div
            className="motion-safe:animate-fade-up mt-8.5 flex gap-2"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <span className="h-1 w-6.5 rounded-full bg-turquoise" />
            <span className="h-1 w-6.5 rounded-full bg-white/28" />
            <span className="h-1 w-6.5 rounded-full bg-white/28" />
          </div>
          <div
            className="motion-safe:animate-fade-up mt-7 flex flex-wrap gap-6.5"
            style={{ animationDelay: "0.25s", animationFillMode: "both" }}
          >
            <Stat value="3X2" label="en 5 categorías clave" />
            <Stat value="5X4" label="en insumos médicos" />
            <Stat value="-50%" label="liquidación por caducidad" />
          </div>
        </div>

        <div
          className="motion-safe:animate-fade-up rounded-3xl border border-white/22 bg-white/8 p-7 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md"
          style={{ animationDelay: "0.14s", animationFillMode: "both" }}
        >
          <span className="motion-safe:animate-badge-pulse inline-block rounded-md bg-urgency-strong px-2.5 py-1.25 font-data text-[0.7rem] font-bold tracking-wide text-white">
            ¡Últimas piezas!
          </span>
          <h2 className="mt-3.5 font-display text-2xl text-white">Liquidación por caducidad</h2>
          <div className="mt-3.5 flex items-baseline gap-2.5">
            <span className="font-data text-[2rem] font-bold tabular-nums text-turquoise">$18.00</span>
            <span className="font-data text-base text-white/55 line-through">$36.00</span>
          </div>
          <p className="mt-2.5 text-[0.9rem] text-[#DDE7FB]">
            Ejemplo de tarjeta para tu lista real de productos próximos a caducar, con
            descuento del 50%.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block font-data text-[1.3rem] tabular-nums text-turquoise">{value}</strong>
      <span className="text-[0.76rem] text-[#C9D6EF]">{label}</span>
    </div>
  );
}
