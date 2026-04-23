"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export interface SliceDatum {
  name: string;
  value: number;
  color: string;
}

export function EssentialityPie({ data }: { data: SliceDatum[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sem despesas no período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
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
              `${formatCurrency(n)} (${((n / total) * 100).toFixed(0)}%)`,
              String(name),
            ];
          }}
        />
        <Legend
          iconType="circle"
          verticalAlign="bottom"
          formatter={(v) => <span className="text-xs">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
