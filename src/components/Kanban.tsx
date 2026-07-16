// Generic Kanban board. Columns carry an accent bar; cards are compact and
// on-palette. Used for seller stock status and admin moderation/accounts queues.
import type { ReactNode } from "react";

export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClass?: string;
  right?: ReactNode;
}

export interface KanbanColumn {
  key: string;
  title: string;
  accent: string; // hex or css var for the header bar/dot
  cards: KanbanCard[];
}

export default function Kanban({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
      {columns.map((col) => (
        <div key={col.key} className="bg-forest-300/15 rounded-lg p-2 min-w-0">
          <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
            <span className="font-body font-semibold text-sm text-forest-950 truncate">{col.title}</span>
            <span className="ml-auto text-[11px] font-mono text-forest-500">{col.cards.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {col.cards.length === 0 ? (
              <p className="text-[11px] text-forest-500 px-1 py-3 text-center">—</p>
            ) : (
              col.cards.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-forest-300 rounded-md p-2.5"
                  style={{ borderLeft: `3px solid ${col.accent}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-body text-sm text-forest-950 leading-tight min-w-0 truncate">{c.title}</p>
                    {c.right}
                  </div>
                  {c.subtitle && <p className="text-[11px] text-forest-500 mt-0.5 truncate">{c.subtitle}</p>}
                  {c.badge && (
                    <span className={`inline-block mt-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded ${c.badgeClass ?? "bg-forest-300/40 text-forest-800"}`}>
                      {c.badge}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
