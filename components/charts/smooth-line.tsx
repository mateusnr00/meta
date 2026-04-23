"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

export interface LinePoint {
  label: string;
  receitas: number;
  despesas: number;
}

export function SmoothLine({
  data,
  height = 280,
}: {
  data: LinePoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          fontSize={11}
        />
        <YAxis
          tickFormatter={(v) => formatCurrencyCompact(Number(v))}
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          fontSize={11}
          width={55}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            String(name) === "receitas" ? "Receitas" : "Despesas",
          ]}
        />
        <Legend
          iconType="circle"
          formatter={(v) => (
            <span className="text-xs capitalize">{v}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="receitas"
          stroke="var(--chart-1)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: "var(--chart-1)" }}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="despesas"
          stroke="var(--chart-2)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: "var(--chart-2)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
