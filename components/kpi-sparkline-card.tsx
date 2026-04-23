import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { MiniSparkline, type SparkPoint } from "@/components/charts/mini-sparkline";

interface Props {
  label: string;
  value: number;
  spark: SparkPoint[];
  color?: string;
  icon?: LucideIcon;
  delta?: { value: number; label?: string } | null;
  format?: "currency" | "number";
  gradient?: "brand" | "success" | "danger" | "info" | "warning" | "none";
}

const gradientMap: Record<string, string> = {
  brand: "gradient-brand",
  success: "gradient-success",
  danger: "gradient-danger",
  info: "gradient-info",
  warning: "gradient-warning",
  none: "",
};

export function KpiSparklineCard({
  label,
  value,
  spark,
  color = "var(--primary)",
  icon: Icon,
  delta,
  format = "currency",
  gradient = "none",
}: Props) {
  const isPositive = delta && delta.value >= 0;

  return (
    <Card className={cn("relative overflow-hidden border-border/60", gradientMap[gradient])}>
      <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
              {format === "currency"
                ? formatCurrency(value)
                : value.toLocaleString("pt-BR")}
            </div>
          </div>
          {Icon ? (
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `color-mix(in oklab, ${color} 18%, transparent)`,
                color,
              }}
            >
              <Icon className="size-4" />
            </div>
          ) : null}
        </div>

        {spark.length > 0 ? (
          <div className="-mx-1">
            <MiniSparkline data={spark} color={color} height={44} />
          </div>
        ) : null}

        {delta ? (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                isPositive
                  ? "bg-success/20 text-success"
                  : "bg-danger/20 text-danger",
              )}
            >
              {isPositive ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )}
              {formatPercent(Math.abs(delta.value), 1)}
            </span>
            <span className="truncate text-muted-foreground">
              {delta.label ?? "vs mês anterior"}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
