"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export interface SparkPoint {
  value: number;
}

export function MiniSparkline({
  data,
  color = "var(--primary)",
  height = 50,
}: {
  data: SparkPoint[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <div style={{ height }} className="w-full" />;
  }

  const id = `spark-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
