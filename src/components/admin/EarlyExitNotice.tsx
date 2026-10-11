/** Aviso al marcar Salida sábado/domingo: si checó antes de la hora de cierre de su turno. */
export function EarlyExitNotice({ isEarlyExit, earlyExitMinutes }: { isEarlyExit?: boolean | null; earlyExitMinutes?: number | null }) {
  if (!isEarlyExit) return null;
  return (
    <p className="mt-1.5 text-[0.82rem] font-semibold text-admin-bad-text">
      ⚠️ Checaste {earlyExitMinutes} min antes de tu hora de salida — esto afecta tu horario laboral.
    </p>
  );
}
