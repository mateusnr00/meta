"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, monthLabel } from "@/lib/format";

interface DayTx {
  id: string;
  type: "receita" | "despesa" | "transferencia";
  amount: number;
  description: string;
  occurred_at: string;
  status: string;
  category?: { id: string; name: string; color: string } | null;
}

interface DayCellProps {
  day: number;
  month: number;
  year: number;
  receitas: number;
  despesas: number;
  isToday: boolean;
  hasData: boolean;
  transactions: DayTx[];
}

export function DayCell({
  day,
  month,
  year,
  receitas,
  despesas,
  isToday,
  hasData,
  transactions,
}: DayCellProps) {
  const [open, setOpen] = useState(false);
  const resultado = receitas - despesas;
  const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

  return (
    <>
      <button
        type="button"
        onClick={() => hasData && setOpen(true)}
        disabled={!hasData}
        className={`flex min-h-[88px] flex-col gap-1 rounded-lg border p-2 text-left transition-colors ${
          isToday
            ? "border-primary/60 bg-primary/5"
            : hasData
              ? "cursor-pointer border-border/60 bg-card/40 hover:border-primary/40 hover:bg-primary/5"
              : "border-border/60 bg-card/40 opacity-60"
        }`}
      >
        <div className="flex items-center justify-between">
          <div
            className={`text-xs font-medium ${
              isToday ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {day}
          </div>
          {transactions.length > 0 ? (
            <div className="text-[9px] text-muted-foreground">
              {transactions.length}
            </div>
          ) : null}
        </div>
        {hasData ? (
          <div className="flex flex-col gap-0.5 text-[10px] tabular-nums">
            {receitas > 0 ? (
              <div className="truncate text-success">
                + {formatCurrency(receitas)}
              </div>
            ) : null}
            {despesas > 0 ? (
              <div className="truncate text-danger">
                - {formatCurrency(despesas)}
              </div>
            ) : null}
            <div
              className={`truncate font-semibold ${
                resultado >= 0 ? "text-success" : "text-danger"
              }`}
            >
              = {formatCurrency(resultado)}
            </div>
          </div>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="border-b border-border/60 p-5 pb-4">
            <SheetTitle className="text-lg">
              {dateStr}
            </SheetTitle>
            <SheetDescription>
              {transactions.length} lançamento
              {transactions.length === 1 ? "" : "s"} —{" "}
              {monthLabel(month)}/{year}
            </SheetDescription>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-success/10 px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Entradas</div>
                <div className="text-sm font-semibold text-success tabular-nums">
                  {formatCurrency(receitas)}
                </div>
              </div>
              <div className="rounded-lg bg-danger/10 px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Saídas</div>
                <div className="text-sm font-semibold text-danger tabular-nums">
                  {formatCurrency(despesas)}
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Resultado</div>
                <div
                  className={`text-sm font-semibold tabular-nums ${
                    resultado >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatCurrency(resultado)}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            <ul className="space-y-2">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: `color-mix(in oklab, ${
                          t.category?.color ?? "var(--muted)"
                        } 22%, var(--card))`,
                        color: t.category?.color ?? "var(--muted-foreground)",
                      }}
                    >
                      {t.type === "receita" ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/transacoes/${t.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {t.description}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {t.category ? <span>{t.category.name}</span> : null}
                        {t.status !== "pago" ? (
                          <Badge
                            variant="outline"
                            className="px-1 py-0 text-[9px] capitalize"
                          >
                            {t.status}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      t.type === "receita"
                        ? "text-success"
                        : t.type === "despesa"
                          ? "text-danger"
                          : ""
                    }`}
                  >
                    {t.type === "despesa" ? "-" : t.type === "receita" ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
