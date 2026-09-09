import type { CalendarDay } from "@/lib/actividades";
import { INVENTORY_CATEGORIES } from "@/lib/actividades";

const WEEKDAY_HEADS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {INVENTORY_CATEGORIES.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.76rem] font-semibold"
          style={{ background: c.softVar, color: c.colorVar }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: c.colorVar }} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export function ActivityCalendarGrid({ weeks }: { weeks: CalendarDay[][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <div className="grid grid-cols-7 border-b border-admin-border bg-admin-bg">
        {WEEKDAY_HEADS.map((d) => (
          <span key={d} className="px-1 py-2 text-center font-display text-[0.72rem] font-semibold uppercase tracking-wide text-admin-ink-soft">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => (
          <div
            key={day.dateStr}
            className={`flex min-h-[5.4rem] flex-col gap-1.5 border-r border-b border-admin-border p-2 ${day.inMonth ? "" : "opacity-45"}`}
          >
            <span className="font-display text-[0.85rem] font-bold text-admin-ink">{day.day}</span>
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-[0.66rem] font-bold whitespace-nowrap"
              style={{ background: day.category.softVar, color: day.category.colorVar }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: day.category.colorVar }} />
              {day.category.label}
            </span>
            {day.weekendShiftLabel && (
              <span className="text-[0.62rem] leading-tight text-admin-ink-soft">+ vitrina/anaqueles · {day.weekendShiftLabel}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
