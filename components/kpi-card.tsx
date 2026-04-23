import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";

interface KpiCardProps {
  label: string;
  value: number;
  format?: "currency" | "number";
  icon?: LucideIcon;
  variant?: "default" | "success" | "danger" | "info";
  delta?: { value: number; label?: string } | null;
  sublabel?: string;
}

export function KpiCard({
  label,
  value,
  format = "currency",
  icon: Icon,
  variant = "default",
  delta,
  sublabel,
}: KpiCardProps) {
  const isPositive = delta && delta.value >= 0;

  const variantClasses = {
    default: "",
    success: "gradient-success",
    danger: "gradient-danger",
    info: "gradient-info",
  }[variant];

  const iconBg = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
    info: "bg-info/15 text-info",
  }[variant];

  return (
    <Card className={cn("border-border/60", variantClasses)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          {Icon ? (
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                iconBg,
              )}
            >
              <Icon className="size-4" />
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {format === "currency" ? formatCurrency(value) : value.toLocaleString("pt-BR")}
          </div>
          {sublabel ? (
            <div className="text-xs text-muted-foreground">{sublabel}</div>
          ) : null}
        </div>

        {delta ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                isPositive
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger",
              )}
            >
              {isPositive ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )}
              {formatPercent(Math.abs(delta.value), 1)}
            </span>
            <span className="text-muted-foreground">
              {delta.label ?? "vs mês anterior"}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
