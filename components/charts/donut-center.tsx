"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function DonutCenter({
  data,
  centerLabel,
  centerValue,
  height = 220,
  showLegend = true,
}: {
  data: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  height?: number;
  showLegend?: boolean;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const hasData = total > 0;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:gap-4">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? data : [{ name: "empty", value: 1, color: "var(--muted)" }]}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={hasData ? 2 : 0}
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {(hasData ? data : [{ color: "var(--muted)" }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            {hasData ? (
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  const n = Number(value);
                  return [
                    `${formatCurrency(n)} (${((n / total) * 100).toFixed(1)}%)`,
                    String(name),
                  ];
                }}
              />
            ) : null}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {centerValue}
          </div>
          <div className="mt-1 max-w-[120px] text-center text-[10px] uppercase tracking-wider text-muted-foreground">
            {centerLabel}
          </div>
        </div>
      </div>

      {showLegend ? (
        <ul className="flex flex-1 flex-col gap-1.5 text-xs">
          {data.slice(0, 6).map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate text-muted-foreground">{d.name}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : "0%"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
