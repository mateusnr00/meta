import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KpiSparklineCard } from "@/components/kpi-sparkline-card";
import { SmoothLine } from "@/components/charts/smooth-line";
import { DonutCenter } from "@/components/charts/donut-center";
import { MiniDonut } from "@/components/charts/mini-donut";
import { HorizontalBars } from "@/components/charts/horizontal-bars";
import { MonthNav } from "@/components/month-nav";
import {
  formatCurrency,
  formatDate,
  shortMonthLabel,
} from "@/lib/format";
import type {
  AccountBalance,
  TransactionWithRelations,
} from "@/types/database";

export const dynamic = "force-dynamic";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

interface SearchParams {
  m?: string;
  y?: string;
}

async function getData(month: number, year: number) {
  const supabase = await createClient();

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(year, month - 2, 1);
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  const [balances, monthTx, prevMonthTx, yearTx, recent] = await Promise.all([
    supabase.from("v_account_balances").select("*"),
    supabase
      .from("transactions")
      .select(
        "id,type,amount,description,occurred_at,essentiality,status,category:categories!transactions_category_id_fkey(id,name,color,essentiality),account:accounts!transactions_account_id_fkey(id,name,color),place:places(id,name)",
      )
      .gte("occurred_at", monthStart.toISOString())
      .lte("occurred_at", monthEnd.toISOString())
      .eq("status", "pago"),
    supabase
      .from("transactions")
      .select("type,amount")
      .gte("occurred_at", prevMonthStart.toISOString())
      .lte("occurred_at", prevMonthEnd.toISOString())
      .eq("status", "pago"),
    supabase
      .from("transactions")
      .select(
        "id,type,amount,occurred_at,category:categories!transactions_category_id_fkey(id,name,color)",
      )
      .gte("occurred_at", yearStart.toISOString())
      .lte("occurred_at", yearEnd.toISOString())
      .eq("status", "pago"),
    supabase
      .from("transactions")
      .select(
        "id,type,amount,description,occurred_at,essentiality,status,category:categories!transactions_category_id_fkey(id,name,color),account:accounts!transactions_account_id_fkey(id,name,color),place:places(id,name)",
      )
      .order("occurred_at", { ascending: false })
      .limit(6),
  ]);

  return {
    balances: (balances.data ?? []) as AccountBalance[],
    monthTx: (monthTx.data ?? []) as unknown as TransactionWithRelations[],
    prevMonthTx: (prevMonthTx.data ?? []) as { type: string; amount: number }[],
    yearTx: (yearTx.data ?? []) as unknown as TransactionWithRelations[],
    recent: (recent.data ?? []) as unknown as TransactionWithRelations[],
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = Number(sp.m) || now.getMonth() + 1;
  const year = Number(sp.y) || now.getFullYear();

  const { balances, monthTx, prevMonthTx, yearTx, recent } = await getData(
    month,
    year,
  );

  const sumBy = (items: { type: string; amount: number }[], type: string) =>
    items
      .filter((t) => t.type === type)
      .reduce((a, b) => a + Number(b.amount || 0), 0);

  const totalBalance = balances.reduce((a, b) => a + Number(b.balance || 0), 0);
  const receitasMes = sumBy(monthTx, "receita");
  const despesasMes = sumBy(monthTx, "despesa");
  const resultadoMes = receitasMes - despesasMes;

  const receitasAnt = sumBy(prevMonthTx, "receita");
  const despesasAnt = sumBy(prevMonthTx, "despesa");
  const deltaReceita =
    receitasAnt > 0 ? (receitasMes - receitasAnt) / receitasAnt : 0;
  const deltaDespesa =
    despesasAnt > 0 ? (despesasMes - despesasAnt) / despesasAnt : 0;

  // Sparklines diárias do mês
  const daysInMonth = new Date(year, month, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTx = monthTx.filter(
      (t) => new Date(t.occurred_at).getDate() === day,
    );
    return {
      day,
      rec: sumBy(dayTx, "receita"),
      desp: sumBy(dayTx, "despesa"),
    };
  });

  // Acumulado de saldo diário
  let runningSaldo = totalBalance - resultadoMes; // saldo no início do mês
  const sparkSaldo = daily.map((d) => {
    runningSaldo += d.rec - d.desp;
    return { value: runningSaldo };
  });
  const sparkReceita = daily.map((d) => ({ value: d.rec }));
  const sparkDespesa = daily.map((d) => ({ value: d.desp }));

  // Receitas e despesas ao longo do ano
  const monthlyYear = Array.from({ length: 12 }, (_, i) => {
    const monthTxY = yearTx.filter(
      (t) => new Date(t.occurred_at).getMonth() === i,
    );
    return {
      label: shortMonthLabel(i + 1),
      receitas: sumBy(monthTxY, "receita"),
      despesas: sumBy(monthTxY, "despesa"),
    };
  });

  // Donut: Despesas por categoria no mês
  const catMapMonth = new Map<
    string,
    { name: string; value: number; color: string }
  >();
  for (const t of monthTx) {
    if (t.type !== "despesa" || !t.category) continue;
    const cur = catMapMonth.get(t.category.id);
    if (cur) cur.value += Number(t.amount);
    else
      catMapMonth.set(t.category.id, {
        name: t.category.name,
        value: Number(t.amount),
        color: t.category.color,
      });
  }
  const catDataMonth = [...catMapMonth.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Donut: Despesas por categoria no ano
  const catMapYear = new Map<
    string,
    { name: string; value: number; color: string }
  >();
  for (const t of yearTx) {
    if (t.type !== "despesa" || !t.category) continue;
    const cur = catMapYear.get(t.category.id);
    if (cur) cur.value += Number(t.amount);
    else
      catMapYear.set(t.category.id, {
        name: t.category.name,
        value: Number(t.amount),
        color: t.category.color,
      });
  }
  const catDataYear = [...catMapYear.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const despesasAno = sumBy(yearTx, "despesa");
  const receitasAno = sumBy(yearTx, "receita");

  const topCategoriaMesPct =
    despesasMes > 0 && catDataMonth[0]
      ? (catDataMonth[0].value / despesasMes) * 100
      : 0;
  const topCategoriaAnoPct =
    despesasAno > 0 && catDataYear[0]
      ? (catDataYear[0].value / despesasAno) * 100
      : 0;

  // Participação de cada categoria top no ano (para mini-donuts)
  const miniDonuts = catDataYear.slice(0, 6).map((c, i) => ({
    name: c.name,
    percent: despesasAno > 0 ? (c.value / despesasAno) * 100 : 0,
    color: PALETTE[i % PALETTE.length],
  }));

  // Detalhamento: barras horizontais das top categorias
  const detalhamento = catDataMonth.slice(0, 6).map((c, i) => ({
    id: c.name,
    name: c.name,
    value: c.value,
    color: PALETTE[i % PALETTE.length],
  }));

  // Insights
  const insights: { kind: "info" | "alert" | "good"; text: string }[] = [];
  if (resultadoMes < 0) {
    insights.push({
      kind: "alert",
      text: `Você está ${formatCurrency(Math.abs(resultadoMes))} no negativo este mês.`,
    });
  } else if (resultadoMes > 0) {
    insights.push({
      kind: "good",
      text: `Saldo positivo no mês: ${formatCurrency(resultadoMes)}.`,
    });
  }
  if (despesasAnt > 0 && deltaDespesa > 0.15) {
    insights.push({
      kind: "alert",
      text: `Gastos subiram ${(deltaDespesa * 100).toFixed(0)}% vs. mês anterior.`,
    });
  }
  if (catDataMonth[0] && catDataMonth[0].value > 0) {
    insights.push({
      kind: "info",
      text: `Categoria que mais consumiu: ${catDataMonth[0].name} (${formatCurrency(catDataMonth[0].value)}).`,
    });
  }

  // Donut palette (vibrant)
  const donutDataMonth = catDataMonth.map((c, i) => ({
    name: c.name,
    value: c.value,
    color: PALETTE[i % PALETTE.length],
  }));
  const donutDataYear = catDataYear.map((c, i) => ({
    name: c.name,
    value: c.value,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header com mês */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Visão geral
          </h2>
          <p className="text-sm text-muted-foreground">
            Seu panorama financeiro em tempo real.
          </p>
        </div>
        <MonthNav month={month} year={year} basePath="/" />
      </div>

      {/* KPIs com sparklines */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiSparklineCard
          label="Saldo atual"
          value={totalBalance}
          spark={sparkSaldo}
          color="var(--chart-3)"
          icon={Wallet}
          gradient="info"
        />
        <KpiSparklineCard
          label="Receitas do mês"
          value={receitasMes}
          spark={sparkReceita}
          color="var(--chart-5)"
          icon={TrendingUp}
          gradient="success"
          delta={receitasAnt > 0 ? { value: deltaReceita } : null}
        />
        <KpiSparklineCard
          label="Despesas do mês"
          value={despesasMes}
          spark={sparkDespesa}
          color="var(--chart-2)"
          icon={TrendingDown}
          gradient="danger"
          delta={despesasAnt > 0 ? { value: deltaDespesa } : null}
        />
        <KpiSparklineCard
          label="Resultado"
          value={resultadoMes}
          spark={daily.map((d) => ({ value: d.rec - d.desp }))}
          color={resultadoMes >= 0 ? "var(--chart-1)" : "var(--chart-2)"}
          icon={PiggyBank}
          gradient={resultadoMes >= 0 ? "brand" : "danger"}
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Insights</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {insights.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {insights.map((it, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                >
                  <span
                    className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${
                      it.kind === "alert"
                        ? "bg-danger"
                        : it.kind === "good"
                        ? "bg-success"
                        : "bg-info"
                    }`}
                  />
                  <span className="text-muted-foreground">{it.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Linha receitas x despesas ano */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Receitas e despesas</CardTitle>
              <CardDescription>Evolução mensal em {year}</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--chart-1)]" />
                <span className="text-muted-foreground">Receitas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--chart-2)]" />
                <span className="text-muted-foreground">Despesas</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pr-2">
          <SmoothLine data={monthlyYear} />
        </CardContent>
      </Card>

      {/* Donuts mês + ano */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Despesas no mês</CardTitle>
            <CardDescription>
              Maior categoria como % das despesas do mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonutCenter
              data={donutDataMonth}
              centerLabel="Top categoria"
              centerValue={`${topCategoriaMesPct.toFixed(1)}%`}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Despesas no ano</CardTitle>
            <CardDescription>
              Maior categoria como % das despesas do ano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DonutCenter
              data={donutDataYear}
              centerLabel="Top categoria"
              centerValue={`${topCategoriaAnoPct.toFixed(1)}%`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento + mini-donuts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card className="border-border/60 lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">
                Detalhamento de despesas
              </CardTitle>
              <CardDescription>
                Top categorias em {shortMonthLabel(month)}/{year}
              </CardDescription>
            </div>
            <Link
              href="/relatorios"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 text-xs",
              )}
            >
              Ver relatório <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={detalhamento} />
          </CardContent>
        </Card>

        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Participação no ano</CardTitle>
            <CardDescription>% de cada top categoria em {year}</CardDescription>
          </CardHeader>
          <CardContent>
            {miniDonuts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Sem despesas registradas.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
                {miniDonuts.map((m) => (
                  <MiniDonut
                    key={m.name}
                    percent={m.percent}
                    color={m.color}
                    label={m.name}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saldo por conta + Últimas transações */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Saldo por conta</CardTitle>
              <CardDescription>
                {formatCurrency(totalBalance)} no total
              </CardDescription>
            </div>
            <Link
              href="/contas"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 text-xs",
              )}
            >
              Gerenciar <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma conta cadastrada.
              </div>
            ) : (
              balances.map((acc) => {
                const pct =
                  totalBalance > 0
                    ? (Number(acc.balance) / totalBalance) * 100
                    : 0;
                return (
                  <div key={acc.account_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: acc.color }}
                        />
                        <span className="truncate">{acc.name}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatCurrency(Number(acc.balance))}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, pct))}%`,
                          backgroundColor: acc.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Últimas transações</CardTitle>
              <CardDescription>
                {receitasAno > 0 || despesasAno > 0
                  ? `Movimentações recentes — ${formatCurrency(
                      receitasAno + despesasAno,
                    )} no ano`
                  : "Movimentações recentes"}
              </CardDescription>
            </div>
            <Link
              href="/transacoes"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 text-xs",
              )}
            >
              Ver todas <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="text-sm text-muted-foreground">
                  Nenhuma transação ainda.
                </div>
                <Link
                  href="/transacoes/nova"
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  Nova transação
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recent.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${
                            t.category?.color ?? "var(--muted)"
                          } 22%, var(--card))`,
                          color: t.category?.color ?? "var(--muted-foreground)",
                        }}
                      >
                        {(t.category?.name ?? t.description)
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {t.description}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{formatDate(t.occurred_at)}</span>
                          {t.category ? (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                {t.category.name}
                              </span>
                            </>
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
                          : "text-muted-foreground"
                      }`}
                    >
                      {t.type === "despesa"
                        ? "-"
                        : t.type === "receita"
                        ? "+"
                        : ""}
                      {formatCurrency(Number(t.amount))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
