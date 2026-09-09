import { FIXED_WEEKLY_SCHEDULE, type FixedShiftTask } from "@/lib/actividades";

function Cell({ task }: { task: FixedShiftTask | null }) {
  if (!task) return <span className="text-[0.72rem] text-admin-ink-soft">Sin turno este día</span>;
  return (
    <>
      <span className="block font-semibold text-admin-ink">{task.task}</span>
      <span className="mt-0.5 block text-[0.72rem] text-admin-ink-soft">{task.sub}</span>
    </>
  );
}

export function FixedWeeklyScheduleTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface">
      <table className="w-full min-w-[760px] border-collapse text-[0.78rem]">
        <thead>
          <tr className="border-b border-admin-border bg-admin-bg">
            <th className="px-3 py-2.5"></th>
            {FIXED_WEEKLY_SCHEDULE.map((d) => (
              <th key={d.weekday} className="px-3 py-2.5 text-center font-display text-[0.72rem] font-semibold uppercase tracking-wide text-admin-ink-soft">
                {d.weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-admin-border">
            <td className="w-24 bg-admin-primary-soft px-3 py-3 text-center font-display text-[0.74rem] font-bold uppercase tracking-wide text-admin-primary-deep">
              Matutino
            </td>
            {FIXED_WEEKLY_SCHEDULE.map((d) => (
              <td key={d.weekday} className="border-l border-admin-border px-3 py-3 align-top leading-relaxed">
                <Cell task={d.matutino} />
              </td>
            ))}
          </tr>
          <tr>
            <td className="w-24 bg-admin-amber-soft px-3 py-3 text-center font-display text-[0.74rem] font-bold uppercase tracking-wide text-admin-amber">
              Vespertino
            </td>
            {FIXED_WEEKLY_SCHEDULE.map((d) => (
              <td key={d.weekday} className="border-l border-admin-border px-3 py-3 align-top leading-relaxed">
                <Cell task={d.vespertino} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
