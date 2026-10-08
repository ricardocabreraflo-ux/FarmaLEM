/** Aviso al marcar Entrada: a tiempo, o retardo (y si ya van 3 esta semana, que habrá descuento). */
export function LatenessNotice({
  isLate,
  lateMinutes,
  weeklyLateCount,
}: {
  isLate?: boolean | null;
  lateMinutes?: number | null;
  weeklyLateCount?: number | null;
}) {
  if (isLate == null) return null;
  if (!isLate) return <p className="mt-1.5 text-[0.82rem] font-semibold text-admin-ok-text">✓ A tiempo</p>;
  const consequence = (weeklyLateCount ?? 0) >= 3;
  return (
    <p className={`mt-1.5 text-[0.82rem] font-semibold ${consequence ? "text-admin-bad-text" : "text-admin-amber"}`}>
      {consequence ? "🔴" : "⚠️"} Retardo de {lateMinutes} min — llevas {weeklyLateCount} esta semana.
      {consequence && " A partir del 3er retardo hay descuento."}
    </p>
  );
}
