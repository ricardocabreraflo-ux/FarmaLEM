import Image from "next/image";
import { Reveal } from "./Reveal";
import { site } from "@/lib/site";

export function Location() {
  return (
    <section id="ubicacion" className="py-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-7">
          <p className="font-data text-xs font-semibold uppercase tracking-widest text-turquoise-deep">
            Encuéntranos
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,1.6vw+1rem,2rem)] text-ink">Ubicación y contacto</h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-7.5 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="relative min-h-[340px] overflow-hidden rounded-[22px] border border-line bg-blue-pale shadow-card">
            <Image
              src="/map-iztapalapa.jpg"
              alt="Mapa de la ubicación de FarmaLEM en Av. Primavera, Iztapalapa"
              fill
              className="object-cover saturate-90"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute left-1/2 top-[54.8%] -translate-x-1/2 -translate-y-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]">
              <div className="relative">
                <span className="motion-safe:animate-radar-ping absolute bottom-px left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-urgency" />
                <svg viewBox="0 0 32 40" width="34" height="42">
                  <path
                    d="M16 0C7.2 0 0 7.1 0 15.9 0 27.5 16 40 16 40s16-12.5 16-24.1C32 7.1 24.8 0 16 0Z"
                    fill="var(--color-urgency)"
                  />
                  <circle cx="16" cy="15.5" r="6.4" fill="#fff" />
                </svg>
              </div>
            </div>
            <a
              href={site.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3.5 left-3.5 rounded-[10px] border border-line bg-surface px-3.5 py-2.25 text-[0.78rem] font-semibold text-blue shadow-card transition-transform duration-150 ease-out hover:text-turquoise-deep active:scale-[0.97]"
            >
              Abrir en Google Maps &rarr;
            </a>
          </Reveal>

          <Reveal className="flex flex-col justify-center gap-5 rounded-[22px] border border-line bg-surface p-7.5 shadow-card">
            <InfoRow label="Sucursal Iztapalapa" value={site.direccion}>
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.4" />
            </InfoRow>
            <InfoRow label="Horario" value={site.horario}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </InfoRow>
            <InfoRow label="Teléfono" value={site.telefonoDisplay} href={`tel:+52${site.telefono}`}>
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 3a2 2 0 0 1-.4 2L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.4c1 .3 2 .5 3 .6a2 2 0 0 1 1.7 2Z" />
            </InfoRow>
            <a
              href={site.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start rounded-full bg-turquoise px-6.5 py-3.5 font-bold text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Escríbenos por WhatsApp
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  href,
  children,
}: {
  label: string;
  value: string;
  href?: string;
  children: React.ReactNode;
}) {
  const valueClassName = "mt-0.75 block text-[0.86rem] text-ink-soft transition-colors hover:text-blue";
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-turquoise-soft text-turquoise-deep">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px]">
          {children}
        </svg>
      </div>
      <div>
        <h5 className="text-[0.92rem] font-semibold text-ink">{label}</h5>
        {href ? (
          <a href={href} className={valueClassName}>
            {value}
          </a>
        ) : (
          <p className={valueClassName}>{value}</p>
        )}
      </div>
    </div>
  );
}
