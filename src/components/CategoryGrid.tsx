import { Reveal } from "./Reveal";

const categorias = [
  {
    nombre: "Analgésicos",
    desc: "Dolor, fiebre e inflamación",
    icon: (
      <>
        <rect x="3" y="10" width="8" height="8" rx="4" transform="rotate(-45 7 14)" />
        <rect x="13" y="6" width="8" height="8" rx="4" transform="rotate(-45 17 10)" />
      </>
    ),
  },
  {
    nombre: "Antihipertensivos",
    desc: "Presión y salud cardiovascular",
    icon: (
      <>
        <path d="M12 21s-6.5-4.4-9-8.6C1.2 8.8 3 5 6.5 5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 2.7 0 4.5 2.2 4.9 4.6" />
        <path d="M4 13h4l1.5-3 2 5 1.5-3H20" />
      </>
    ),
  },
  {
    nombre: "Gastrointestinales",
    desc: "Digestión y malestar estomacal",
    icon: (
      <>
        <path d="M8 3c-1 2-1.5 3.6-1.5 5.4C6.5 12 9 14 9 17a4 4 0 0 1-4 4" />
        <path d="M15 3c1.4 2.6 2 4.6 2 6.6C17 14 14 15 14 19a3 3 0 0 0 3 3" />
      </>
    ),
  },
  {
    nombre: "Respiratorios / Alergias",
    desc: "Tos, gripe y alergias",
    icon: (
      <>
        <path d="M9 3v6a4 4 0 0 1-4 4c-1.7 0-3-1.5-3-3.4" />
        <path d="M15 3v6a4 4 0 0 0 4 4c1.7 0 3-1.5 3-3.4" />
      </>
    ),
  },
  {
    nombre: "Vitaminas y Suplementos",
    desc: "Energía y defensas",
    icon: (
      <>
        <path d="M12 3c3 2 5 5.4 5 9a5 5 0 0 1-10 0c0-3.6 2-7 5-9Z" />
        <path d="M12 12v6" />
      </>
    ),
  },
  {
    nombre: "Cuidado Personal",
    desc: "Higiene y bienestar diario",
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="4" />
        <path d="M7 9h10" />
      </>
    ),
  },
  {
    nombre: "Insumos Médicos",
    desc: "Jeringas, cubrebocas y más",
    icon: (
      <>
        <path d="M20 4 10 14" />
        <path d="M17 3l4 4" />
        <path d="M9 15l-5 5" />
        <path d="m11 13-2-2" />
      </>
    ),
  },
  {
    nombre: "Equipo y Botiquín",
    desc: "Primeros auxilios en casa",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        <path d="M12 11v5M9.5 13.5h5" />
      </>
    ),
  },
];

export function CategoryGrid() {
  return (
    <section id="categorias" className="py-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-7">
          <p className="font-data text-xs font-semibold uppercase tracking-widest text-turquoise-deep">
            Directorio de pasillos
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,1.6vw+1rem,2rem)] text-ink">Categorías</h2>
          <p className="mt-2 max-w-[56ch] text-sm text-ink-soft">
            El mismo acomodo que encontrarías caminando por la farmacia — para llegar
            directo a lo que necesitas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {categorias.map((cat, i) => (
            <Reveal
              key={cat.nombre}
              className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface px-[18px] py-[22px] shadow-[0_10px_22px_-18px_rgb(27_39_51_/_0.35)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-1 hover:shadow-card"
              style={{ transitionDelay: `${i * 0.04}s` }}
            >
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-blue-pale text-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                  {cat.icon}
                </svg>
              </div>
              <h3 className="font-body text-[0.92rem] font-semibold text-ink">{cat.nombre}</h3>
              <span className="text-[0.78rem] text-ink-soft">{cat.desc}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
