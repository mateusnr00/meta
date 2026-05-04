import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, monthLabel } from "@/lib/format";
import type { TransactionWithRelations } from "@/types/database";
import { DayCell } from "./day-detail-button";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ m?: string; y?: string }>;
}

export default async function CalendarioPage({ searchParams }: Props) {
  const sp = await searchParams;
  const now = new Date();
  const month = Number(sp.m ?? now.getMonth() + 1);
  const year = Number(sp.y ?? now.getFullYear());

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const daysInMonth = end.getDate();
  const firstWeekday = start.getDay();

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(
      "id,type,amount,description,occurred_at,status,category:categories!transactions_category_id_fkey(id,name,color)",
    )
    .gte("occurred_at", start.toISOString())
    .lte("occurred_at", end.toISOString())
    .order("occurred_at", { ascending: true });

  const txs = (data ?? []) as unknown as TransactionWithRelations[];

  // Agrupa por dia
  const byDay = new Map<
    number,
    {
      receitas: number;
      despesas: number;
      transactions: TransactionWithRelations[];
    }
  >();
  for (let i = 1; i <= daysInMonth; i++) {
    byDay.set(i, { receitas: 0, despesas: 0, transactions: [] });
  }
  for (const t of txs) {
    const day = new Date(t.occurred_at).getDate();
    const entry = byDay.get(day);
    if (!entry) continue;
    if (t.type === "receita") entry.receitas += Number(t.amount);
    if (t.type === "despesa") entry.despesas += Number(t.amount);
    entry.transactions.push(t);
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const totalRec = txs
    .filter((t) => t.type === "receita")
    .reduce((a, b) => a + Number(b.amount), 0);
  const totalDesp = txs
    .filter((t) => t.type === "despesa")
    .reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Calendário financeiro
          </h2>
          <p className="text-sm text-muted-foreground">
            Visão diária das movimentações.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendario?m=${prevMonth}&y=${prevYear}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-32 text-center text-sm font-medium">
            {monthLabel(month)} {year}
          </div>
          <Link
            href={`/calendario?m=${nextMonth}&y=${nextYear}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Entradas</div>
            <div className="mt-1 text-lg font-semibold text-success tabular-nums">
              {formatCurrency(totalRec)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Saídas</div>
            <div className="mt-1 text-lg font-semibold text-danger tabular-nums">
              {formatCurrency(totalDesp)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Resultado</div>
            <div
              className={`mt-1 text-lg font-semibold tabular-nums ${
                totalRec - totalDesp >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(totalRec - totalDesp)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {monthLabel(month)} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const entry = byDay.get(day)!;
              const hasData = entry.transactions.length > 0;
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() + 1 &&
                year === now.getFullYear();

              return (
                <DayCell
                  key={day}
                  day={day}
                  month={month}
                  year={year}
                  receitas={entry.receitas}
                  despesas={entry.despesas}
                  isToday={isToday}
                  hasData={hasData}
                  transactions={entry.transactions.map((t) => ({
                    id: t.id,
                    type: t.type,
                    amount: Number(t.amount),
                    description: t.description,
                    occurred_at: t.occurred_at,
                    status: t.status,
                    category: t.category ?? null,
                  }))}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
