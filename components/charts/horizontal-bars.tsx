"use client";

import { formatCurrency } from "@/lib/format";

export interface HBar {
  id: string;
  name: string;
  value: number;
  color: string;
}

export function HorizontalBars({ data }: { data: HBar[] }) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Sem dados no período.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <li key={d.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{d.name}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCurrency(d.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(2, pct)}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
