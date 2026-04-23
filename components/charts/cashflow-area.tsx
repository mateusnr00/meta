"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";

export interface CashflowPoint {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export function CashflowArea({ data }: { data: CashflowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="recGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="despGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={60}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            String(name) === "receitas"
              ? "Receitas"
              : String(name) === "despesas"
              ? "Despesas"
              : "Saldo",
          ]}
        />
        <Area
          type="monotone"
          dataKey="receitas"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#recGradient)"
        />
        <Area
          type="monotone"
          dataKey="despesas"
          stroke="var(--danger)"
          strokeWidth={2}
          fill="url(#despGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
