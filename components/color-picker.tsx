"use client";

import { useState } from "react";

const PALETTE = [
  "#10b981", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#f59e0b",
  "#eab308", "#64748b", "#475569",
];

export function ColorPicker({
  name,
  defaultValue = "#64748b",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [color, setColor] = useState(defaultValue);
  return (
    <>
      <input type="hidden" name={name} value={color} />
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`size-6 rounded-full ring-offset-background transition-transform hover:scale-110 ${
              color === c ? "ring-2 ring-offset-2" : ""
            }`}
            style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
            aria-label={c}
          />
        ))}
      </div>
    </>
  );
}
