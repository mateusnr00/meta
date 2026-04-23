"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

export interface MonthlyDatum {
  label: string;
  receitas: number;
  despesas: number;
}

export function MonthlyBar({ data }: { data: MonthlyDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
          width={70}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
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
        <Bar
          dataKey="receitas"
          fill="var(--success)"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="despesas"
          fill="var(--danger)"
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
