"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function MiniDonut({
  percent,
  color,
  label,
  size = 72,
}: {
  percent: number;
  color: string;
  label: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const data = [
    { value: clamped, color },
    { value: 100 - clamped, color: "var(--muted)" },
  ];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <div className="max-w-full truncate text-center text-[10px] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
