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
import { KpiCard } from "@/components/kpi-card";
import { CashflowArea } from "@/components/charts/cashflow-area";
import { CategoriesBar } from "@/components/charts/categories-bar";
import { EssentialityPie } from "@/components/charts/essentiality-pie";
import {
  formatCurrency,
  formatDate,
  startOfMonth,
  endOfMonth,
  shortMonthLabel,
} from "@/lib/format";
import type {
  AccountBalance,
  TransactionWithRelations,
} from "@/types/database";

export const dynamic = "force-dynamic";

async function getData() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );
  const prevMonthEnd = endOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  const [balances, monthTx, prevMonthTx, recent] = await Promise.all([
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
        "id,type,amount,description,occurred_at,essentiality,status,category:categories!transactions_category_id_fkey(id,name,color),account:accounts!transactions_account_id_fkey(id,name,color),place:places(id,name)",
      )
      .order("occurred_at", { ascending: false })
      .limit(8),
  ]);

  return {
    balances: (balances.data ?? []) as AccountBalance[],
    monthTx: (monthTx.data ?? []) as unknown as TransactionWithRelations[],
    prevMonthTx: (prevMonthTx.data ?? []) as { type: string; amount: number }[],
    recent: (recent.data ?? []) as unknown as TransactionWithRelations[],
  };
}

export default async function DashboardPage() {
  const { balances, monthTx, prevMonthTx, recent } = await getData();

  const totalBalance = balances.reduce((a, b) => a + Number(b.balance || 0), 0);

  const sumBy = (
    items: { type: string; amount: number }[],
    type: string,
  ): number =>
    items
      .filter((t) => t.type === type)
      .reduce((a, b) => a + Number(b.amount || 0), 0);

  const receitasMes = sumBy(monthTx, "receita");
  const despesasMes = sumBy(monthTx, "despesa");
  const resultadoMes = receitasMes - despesasMes;

  const receitasAnt = sumBy(prevMonthTx, "receita");
  const despesasAnt = sumBy(prevMonthTx, "despesa");

  const deltaReceita =
    receitasAnt > 0 ? (receitasMes - receitasAnt) / receitasAnt : 0;
  const deltaDespesa =
    despesasAnt > 0 ? (despesasMes - despesasAnt) / despesasAnt : 0;

  // Fluxo diário do mês
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const cashflow = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTx = monthTx.filter(
      (t) => new Date(t.occurred_at).getDate() === day,
    );
    const rec = sumBy(dayTx, "receita");
    const desp = sumBy(dayTx, "despesa");
    return {
      label: String(day).padStart(2, "0"),
      receitas: rec,
      despesas: desp,
      saldo: rec - desp,
    };
  });

  // Top categorias do mês (despesa)
  const catMap = new Map<string, { name: string; value: number; color: string }>();
  for (const t of monthTx) {
    if (t.type !== "despesa" || !t.category) continue;
    const key = t.category.id;
    const cur = catMap.get(key);
    if (cur) cur.value += Number(t.amount);
    else
      catMap.set(key, {
        name: t.category.name,
        value: Number(t.amount),
        color: t.category.color,
      });
  }
  const topCategorias = [...catMap.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // Essencial x supérfluo
  const essencial = monthTx
    .filter((t) => t.type === "despesa" && (t.essentiality === "essencial" || t.category?.essentiality === "essencial"))
    .reduce((a, b) => a + Number(b.amount), 0);
  const superfluo = monthTx
    .filter((t) => t.type === "despesa" && (t.essentiality === "superfluo" || t.category?.essentiality === "superfluo"))
    .reduce((a, b) => a + Number(b.amount), 0);
  const neutro = despesasMes - essencial - superfluo;

  const pieData = [
    { name: "Essenciais", value: essencial, color: "var(--chart-3)" },
    { name: "Supérfluos", value: superfluo, color: "var(--chart-2)" },
    { name: "Neutros", value: Math.max(0, neutro), color: "var(--chart-4)" },
  ].filter((p) => p.value > 0);

  // Insights automáticos
  const insights: { kind: "info" | "alert" | "good"; text: string }[] = [];
  const diasCorridos = Math.max(1, new Date().getDate());
  const projDespesa = (despesasMes / diasCorridos) * daysInMonth;
  if (resultadoMes < 0) {
    insights.push({
      kind: "alert",
      text: `Você está ${formatCurrency(Math.abs(resultadoMes))} no negativo este mês.`,
    });
  } else {
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
  if (topCategorias[0] && topCategorias[0].value > 0) {
    insights.push({
      kind: "info",
      text: `Categoria que mais consumiu: ${topCategorias[0].name} (${formatCurrency(topCategorias[0].value)}).`,
    });
  }
  if (projDespesa > despesasAnt && despesasAnt > 0) {
    insights.push({
      kind: "info",
      text: `Projeção de fechamento: ${formatCurrency(projDespesa)} em despesas.`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Visão geral — {shortMonthLabel(new Date().getMonth() + 1)}/{new Date().getFullYear()}
          </h2>
          <p className="text-sm text-muted-foreground">
            Seu panorama financeiro do mês em tempo real.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Saldo atual"
          value={totalBalance}
          icon={Wallet}
          variant={totalBalance >= 0 ? "info" : "danger"}
          sublabel={`${balances.length} conta${balances.length === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Receitas do mês"
          value={receitasMes}
          icon={TrendingUp}
          variant="success"
          delta={receitasAnt > 0 ? { value: deltaReceita } : null}
        />
        <KpiCard
          label="Despesas do mês"
          value={despesasMes}
          icon={TrendingDown}
          variant="danger"
          delta={despesasAnt > 0 ? { value: deltaDespesa } : null}
        />
        <KpiCard
          label="Resultado do mês"
          value={resultadoMes}
          icon={PiggyBank}
          variant={resultadoMes >= 0 ? "success" : "danger"}
          sublabel={resultadoMes >= 0 ? "Você está poupando" : "Cuidado com o ritmo"}
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Insights do mês</CardTitle>
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
                    className={`mt-1 inline-block size-2 shrink-0 rounded-full ${
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fluxo do mês</CardTitle>
            <CardDescription>Receitas e despesas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <CashflowArea data={cashflow} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Essencial × supérfluo</CardTitle>
            <CardDescription>Classificação dos gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <EssentialityPie data={pieData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Top categorias</CardTitle>
              <CardDescription>Onde mais gastou este mês</CardDescription>
            </div>
            <Link
              href="/relatorios"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
            >
              Ver relatório <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <CategoriesBar data={topCategorias} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Saldo por conta</CardTitle>
              <CardDescription>Distribuição atual</CardDescription>
            </div>
            <Link
              href="/contas"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
            >
              Gerenciar <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {balances.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma conta cadastrada ainda.
              </div>
            ) : (
              balances.map((acc) => {
                const pct =
                  totalBalance > 0 ? (Number(acc.balance) / totalBalance) * 100 : 0;
                return (
                  <div key={acc.account_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: acc.color }}
                        />
                        <span>{acc.name}</span>
                      </div>
                      <span className="font-medium tabular-nums">
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
      </div>

      {/* Últimas transações */}
      <Card className="border-border/60">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Últimas transações</CardTitle>
            <CardDescription>Movimentações mais recentes</CardDescription>
          </div>
          <Link
            href="/transacoes"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          >
            Ver todas <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="text-sm text-muted-foreground">
                Nenhuma transação ainda. Que tal começar agora?
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
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${
                          t.category?.color ?? "var(--muted)"
                        } 18%, var(--card))`,
                        color: t.category?.color ?? "var(--muted-foreground)",
                      }}
                    >
                      {(t.category?.name ?? t.description).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {t.description}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formatDate(t.occurred_at)}</span>
                        {t.category ? (
                          <>
                            <span>·</span>
                            <span>{t.category.name}</span>
                          </>
                        ) : null}
                        {t.place ? (
                          <>
                            <span>·</span>
                            <span className="truncate">{t.place.name}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      t.type === "receita"
                        ? "text-success"
                        : t.type === "despesa"
                        ? "text-danger"
                        : "text-muted-foreground"
                    }`}
                  >
                    {t.type === "despesa" ? "-" : t.type === "receita" ? "+" : ""}
                    {formatCurrency(Number(t.amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
