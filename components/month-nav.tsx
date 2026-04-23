"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortMonthLabel, monthLabel } from "@/lib/format";

export function MonthNav({
  month,
  year,
  basePath = "/",
}: {
  month: number;
  year: number;
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const navigate = (m: number, y: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("m", String(m));
    next.set("y", String(y));
    router.push(`${basePath}?${next.toString()}`);
  };

  const prev = () =>
    month === 1 ? navigate(12, year - 1) : navigate(month - 1, year);
  const next = () =>
    month === 12 ? navigate(1, year + 1) : navigate(month + 1, year);

  const now = new Date();
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={prev}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-[6.5rem] px-2 text-center text-sm font-medium">
        <span className="hidden sm:inline">{monthLabel(month)}</span>
        <span className="sm:hidden">{shortMonthLabel(month)}</span>{" "}
        <span className="text-muted-foreground">{year}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={next}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" />
      </Button>
      {!isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={() => navigate(now.getMonth() + 1, now.getFullYear())}
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
