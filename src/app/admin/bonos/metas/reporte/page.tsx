import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listBonusTiers } from "@/lib/bonuses";
import { PrintButton } from "@/components/admin/PrintButton";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Pirámide de metas" };
export const dynamic = "force-dynamic";

const LEVELS = [4, 3, 2, 1];
// De arriba (meta más alta, bono mayor) hacia abajo (meta base).
const LEVEL_COLORS: Record<number, string> = { 4: "#e2711d", 3: "#c15b31", 2: "#8f3f30", 1: "#8d8d8d" };

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function PiramideMetasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const tiers = await listBonusTiers(month);
  const find = (shift: "Matutino" | "Vespertino", level: number) => tiers.find((t) => t.shift === shift && t.level === level);
  const ready = LEVELS.every((l) => find("Matutino", l) && find("Vespertino", l));

  // Geometría de la pirámide: 4 franjas de igual alto, del ápice (0% de ancho) a la base (100%).
  const CX = 400;
  const TOP_Y = 30;
  const BAND_H = 100;
  const HALF_BASE = 280;
  const halfWidthAt = (y: number) => (HALF_BASE * (y - TOP_Y)) / (BAND_H * 4);

  return (
    <main className="mx-auto max-w-[820px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>

      <Link href={`/admin/bonos/metas?mes=${month}`} className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a Configurar metas
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900 capitalize">Pirámide de metas &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <MonthPicker month={month} basePath="/admin/bonos/metas/reporte" className="mt-4 flex items-end gap-3 print:hidden" />

      {!ready ? (
        <p className="mt-10 rounded-2xl border border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Este mes todavía no tiene las 8 metas configuradas (4 niveles &times; 2 turnos). Ve a{" "}
          <Link href={`/admin/bonos/metas?mes=${month}`} className="font-semibold text-emerald-700">
            Configurar metas
          </Link>{" "}
          y captúralas primero.
        </p>
      ) : (
        <>
          <div className="mt-6 text-center">
            <h2 className="font-display text-2xl tracking-wide text-slate-900 uppercase">Pirámide de metas semanal FarmaLEM</h2>
            <p className="font-display text-lg text-slate-700 uppercase">{monthLabel(month)}</p>
          </div>

          <svg viewBox="0 0 800 460" className="mx-auto mt-4 w-full max-w-[640px]">
            {LEVELS.map((level, i) => {
              const yTop = TOP_Y + i * BAND_H;
              const yBottom = yTop + BAND_H;
              const topHalf = halfWidthAt(yTop);
              const bottomHalf = halfWidthAt(yBottom);
              const labelY = yBottom - 14;
              const mat = find("Matutino", level)!;
              const ves = find("Vespertino", level)!;

              return (
                <g key={level}>
                  <polygon
                    points={`${CX - topHalf},${yTop} ${CX + topHalf},${yTop} ${CX + bottomHalf},${yBottom} ${CX - bottomHalf},${yBottom}`}
                    fill={LEVEL_COLORS[level]}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text x={CX} y={labelY} textAnchor="middle" fontSize="24" fontWeight="700" fill="#fff">
                    {fmtMoney(mat.bonus)}
                  </text>
                  <text x={CX - bottomHalf - 18} y={labelY - 2} textAnchor="end" fontSize="17" fontWeight="700" fill="#1e293b">
                    {fmtMoney(mat.goal)}
                  </text>
                  <text x={CX + bottomHalf + 18} y={labelY - 2} textAnchor="start" fontSize="17" fontWeight="700" fill="#1e293b">
                    {fmtMoney(ves.goal)}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mx-auto flex max-w-[640px] justify-between px-2 text-[0.78rem] font-semibold text-slate-500 uppercase">
            <span>Matutino</span>
            <span>Vespertino</span>
          </div>

          <div className="mx-auto mt-8 max-w-[520px] overflow-hidden rounded-xl border border-slate-300">
            <div className="border-b border-slate-300 bg-slate-100 py-2 text-center font-display text-[0.9rem] font-bold text-slate-900 uppercase">
              Promedio diario por turno
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-300">
              {(["Matutino", "Vespertino"] as const).map((shift) => (
                <div key={shift}>
                  <div className="border-b border-slate-300 py-1.5 text-center text-[0.82rem] font-bold text-emerald-700 uppercase">{shift}</div>
                  <table className="w-full text-[0.85rem]">
                    <tbody>
                      {LEVELS.slice()
                        .reverse()
                        .map((level) => {
                          const tier = find(shift, level)!;
                          return (
                            <tr key={level} className="border-b border-slate-200 last:border-0">
                              <td className="py-1.5 pl-4 font-semibold text-slate-700">Meta {level}</td>
                              <td className="py-1.5 pr-4 text-right font-data tabular-nums text-slate-900">{fmtMoney(tier.goal / 7)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          <ul className="mx-auto mt-8 max-w-[640px] list-none space-y-1 text-[0.8rem] text-slate-600">
            <li>* Cada mes se incrementa la meta.</li>
            <li>** Es el promedio que deben contemplar para llegar a sus metas.</li>
            <li>*** Se contemplan 4 semanas.</li>
            <li>**** Si faltan un día se pierde su bono.</li>
          </ul>
        </>
      )}
    </main>
  );
}
