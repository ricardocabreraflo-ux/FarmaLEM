import { Reveal } from "./Reveal";

const diferenciadores = [
  {
    n: "01",
    titulo: "Precios claros",
    texto: "Lo que ves en la góndola es lo que pagas en caja. Sin letras chiquitas.",
  },
  {
    n: "02",
    titulo: "Atención cercana",
    texto: "El mismo farmacéutico de siempre, que te conoce a ti y a tu familia.",
  },
  {
    n: "03",
    titulo: "Patente y genéricos",
    texto: "Para cada receta, te mostramos la opción que se ajusta a tu bolsillo.",
  },
  {
    n: "04",
    titulo: "Siempre a la vuelta",
    texto: "Sucursal de barrio, sin filas de centro comercial.",
  },
];

export function WhyFarmaLEM() {
  return (
    <section className="bg-blue-deep py-16 text-white">
      <div className="mx-auto max-w-[1180px] px-6">
        <p className="font-data text-xs font-semibold uppercase tracking-widest text-[#9FD9D4]">
          Por qué FarmaLEM
        </p>
        <h2 className="mt-2 font-display text-[clamp(1.5rem,1.6vw+1rem,2rem)] text-white">
          Confianza médica, cercanía de barrio.
        </h2>
        <p className="mt-2 max-w-[56ch] text-sm text-[#C9D6EF]">
          Lo que nos distingue no es un eslogan — es cómo atendemos cada día.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {diferenciadores.map((d, i) => (
            <Reveal key={d.n} style={{ transitionDelay: `${i * 0.06}s` }}>
              <span className="font-data text-[0.78rem] text-turquoise">{d.n}</span>
              <h3 className="mt-2.5 font-display text-[1.12rem] text-white">{d.titulo}</h3>
              <p className="mt-2 text-[0.88rem] text-[#C9D6EF]">{d.texto}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
