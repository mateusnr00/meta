"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { upsertBudget, deleteBudget } from "./actions";

export function BudgetRow({
  categoryId,
  categoryName,
  categoryColor,
  spent,
  budget,
  budgetId,
  month,
  year,
}: {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  spent: number;
  budget: number | null;
  budgetId: string | null;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(budget != null ? String(budget) : "");
  const [pending, start] = useTransition();

  const pct = budget && budget > 0 ? (spent / budget) * 100 : 0;
  const clamped = Math.min(100, pct);
  const level: "ok" | "warn" | "over" =
    pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";

  const barColor =
    level === "over"
      ? "bg-danger"
      : level === "warn"
      ? "bg-warning"
      : "bg-success";

  async function save() {
    start(async () => {
      const num = Number(value.replace(",", "."));
      if (!Number.isFinite(num) || num <= 0) {
        if (budgetId) {
          const res = await deleteBudget(budgetId);
          if (res?.error) toast.error(res.error);
          else {
            toast.success("Orçamento removido");
            setEditing(false);
            router.refresh();
          }
        } else {
          setEditing(false);
        }
        return;
      }
      const fd = new FormData();
      fd.set("category_id", categoryId);
      fd.set("amount", String(num));
      fd.set("month", String(month));
      fd.set("year", String(year));
      const res = await upsertBudget(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Orçamento salvo");
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <li className="space-y-2 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          <span className="truncate text-sm font-medium">{categoryName}</span>
        </div>
        <div className="flex items-center gap-1">
          {!editing ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setEditing(true)}
              aria-label="Editar orçamento"
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={() => {
                  setEditing(false);
                  setValue(budget != null ? String(budget) : "");
                }}
                aria-label="Cancelar"
              >
                <X className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-success"
                onClick={save}
                disabled={pending}
                aria-label="Salvar"
              >
                <Check className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="0,00 (vazio = sem orçamento)"
            className="h-8 text-sm"
          />
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="tabular-nums">
              <span className={cn("font-semibold", {
                "text-danger": level === "over",
                "text-warning": level === "warn",
              })}>{formatCurrency(spent)}</span>
              <span className="text-muted-foreground">
                {" "}
                de {budget != null ? formatCurrency(budget) : "—"}
              </span>
            </span>
            <span
              className={cn("text-xs font-medium", {
                "text-danger": level === "over",
                "text-warning": level === "warn",
                "text-muted-foreground": level === "ok",
              })}
            >
              {budget && budget > 0 ? `${pct.toFixed(0)}%` : "sem orçamento"}
            </span>
          </div>
          {budget && budget > 0 ? (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${Math.max(2, clamped)}%` }}
              />
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}
