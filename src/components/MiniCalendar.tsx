// Month calendar heat-map: each day cell shades by activity intensity (leaf).
// `values` maps an ISO date (YYYY-MM-DD) to a numeric magnitude; the current
// month is shown, with a hover tooltip carrying the exact value.
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MiniCalendar({
  values,
  format = (v: number) => `${v}`,
}: {
  values: Record<string, number>;
  format?: (v: number) => string;
}) {
  const { t, i18n } = useTranslation();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // Monday-first
  const max = Math.max(...Object.values(values), 1);

  const monthLabel = cursor.toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const weekdays =
    i18n.language === "fr"
      ? ["L", "M", "M", "J", "V", "S", "D"]
      : ["M", "T", "W", "T", "F", "S", "S"];

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const iso = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 text-forest-800 hover:bg-forest-300/30 rounded" aria-label={t("common.back")}>
          <ChevronLeft size={16} />
        </button>
        <span className="font-body font-semibold text-sm text-forest-950 capitalize">{monthLabel}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 text-forest-800 hover:bg-forest-300/30 rounded" aria-label={t("home.viewAll")}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((w, i) => (
          <span key={i} className="text-[10px] text-forest-500 font-mono">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const v = values[iso(day)] ?? 0;
          const intensity = v > 0 ? 0.18 + (v / max) * 0.82 : 0;
          const isToday = iso(day) === todayIso;
          return (
            <div
              key={i}
              className={`aspect-square rounded flex items-center justify-center text-[11px] ${isToday ? "ring-1 ring-forest-800" : ""}`}
              style={{
                background: v > 0 ? `color-mix(in srgb, var(--color-leaf) ${Math.round(intensity * 100)}%, transparent)` : "var(--color-forest-300)",
                opacity: v > 0 ? 1 : 0.35,
              }}
              title={v > 0 ? `${iso(day)}: ${format(v)}` : iso(day)}
            >
              <span className={v / max > 0.6 ? "text-cream" : "text-forest-950"}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
