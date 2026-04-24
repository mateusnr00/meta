import { Target, Wallet, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthNav } from "@/components/month-nav";
import {
  formatCurrency,
  formatDate,
  monthLabel,
  startOfMonth,
  endOfMonth,
} from "@/lib/format";
import type { Budget, Category, Goal } from "@/types/database";
import { BudgetRow } from "./budget-row";
import { GoalDialog, EditGoalButton } from "./goal-dialog";
import { GoalQuickAdd } from "./goal-progress";
import { DeleteButton } from "../categorias/delete-button";
import { deleteGoal } from "./actions";

export const dynamic = "force-dynamic";

interface SearchParams {
  m?: string;
  y?: string;
  tab?: string;
}

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = Number(sp.m) || now.getMonth() + 1;
  const year = Number(sp.y) || now.getFullYear();

  const supabase = await createClient();
  const periodStart = startOfMonth(new Date(year, month - 1, 1)).toISOString();
  const periodEnd = endOfMonth(new Date(year, month - 1, 1)).toISOString();

  const [catsRes, budgetsRes, txRes, goalsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("archived", false)
      .eq("type", "despesa")
      .is("parent_id", null)
      .order("name"),
    supabase
      .from("budgets")
      .select("*")
      .eq("month", month)
      .eq("year", year),
    supabase
      .from("transactions")
      .select("category_id,amount,type,status")
      .eq("type", "despesa")
      .eq("status", "pago")
      .eq("excluded_from_stats", false)
      .gte("occurred_at", periodStart)
      .lte("occurred_at", periodEnd),
    supabase
      .from("goals")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false }),
  ]);

  const categories = (catsRes.data ?? []) as Category[];
  const budgets = (budgetsRes.data ?? []) as Budget[];
  const goals = (goalsRes.data ?? []) as Goal[];

  // Spent por categoria no mês
  const spentByCat = new Map<string, number>();
  for (const t of txRes.data ?? []) {
    if (!t.category_id) continue;
    spentByCat.set(
      t.category_id,
      (spentByCat.get(t.category_id) ?? 0) + Number(t.amount),
    );
  }

  const budgetByCat = new Map(budgets.map((b) => [b.category_id, b]));

  const rows = categories.map((c) => {
    const spent = spentByCat.get(c.id) ?? 0;
    const budget = budgetByCat.get(c.id);
    return {
      category: c,
      spent,
      budget: budget?.amount ?? null,
      budgetId: budget?.id ?? null,
    };
  });

  // Totais
  const totalOrcado = budgets.reduce((a, b) => a + Number(b.amount), 0);
  const totalGasto = [...spentByCat.values()].reduce((a, b) => a + b, 0);
  const categoriasComOrcamento = budgets.length;
  const categoriasEstouradas = rows.filter(
    (r) => r.budget != null && r.spent > r.budget,
  ).length;

  const tab = sp.tab === "metas" ? "metas" : "orcamento";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Metas & Orçamentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Planeje seus gastos e suas metas de economia.
          </p>
        </div>
      </div>

      <Tabs defaultValue={tab}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="orcamento" className="gap-2">
            <Wallet className="size-4" />
            Orçamento
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2">
            <Target className="size-4" />
            Metas
          </TabsTrigger>
        </TabsList>

        {/* ORÇAMENTOS */}
        <TabsContent value="orcamento" className="mt-5 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Orçamento de {monthLabel(month)}/{year}
            </div>
            <MonthNav month={month} year={year} basePath="/metas" />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Total orçado
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCurrency(totalOrcado)}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  em {categoriasComOrcamento} categorias
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Total gasto
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-danger">
                  {formatCurrency(totalGasto)}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  no período
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Disponível
                </div>
                <div
                  className={`mt-1 text-lg font-semibold tabular-nums ${
                    totalOrcado - totalGasto >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {formatCurrency(totalOrcado - totalGasto)}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  orçado − gasto
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Estouradas
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-danger">
                  {categoriasEstouradas}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  categorias acima do limite
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Por categoria</CardTitle>
              <CardDescription>
                Clique no lápis pra editar o orçamento da categoria. Deixe vazio
                para remover.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma categoria de despesa cadastrada.
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((r) => (
                    <BudgetRow
                      key={r.category.id}
                      categoryId={r.category.id}
                      categoryName={r.category.name}
                      categoryColor={r.category.color}
                      spent={r.spent}
                      budget={r.budget}
                      budgetId={r.budgetId}
                      month={month}
                      year={year}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* METAS */}
        <TabsContent value="metas" className="mt-5 space-y-5">
          <div className="flex items-center justify-end">
            <GoalDialog />
          </div>

          {goals.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <Trophy className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Nenhuma meta ainda</h3>
                  <p className="text-xs text-muted-foreground">
                    Crie uma meta de economia pra acompanhar seu progresso.
                  </p>
                </div>
                <GoalDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {goals.map((g) => {
                const target = Number(g.target_amount);
                const current = Number(g.current_amount);
                const pct = target > 0 ? (current / target) * 100 : 0;
                const done = pct >= 100;
                const remaining = Math.max(0, target - current);

                let daysLeft: number | null = null;
                if (g.target_date) {
                  const tgt = new Date(g.target_date);
                  tgt.setHours(23, 59, 59, 999);
                  daysLeft = Math.ceil(
                    (tgt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                }

                return (
                  <Card
                    key={g.id}
                    className="overflow-hidden border-border/60"
                  >
                    <div
                      className="relative px-5 pt-5 pb-4"
                      style={{
                        background: `linear-gradient(135deg, color-mix(in oklab, ${g.color} 30%, var(--card)), color-mix(in oklab, ${g.color} 8%, var(--card)))`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-10 items-center justify-center rounded-xl text-white shadow-lg"
                            style={{ backgroundColor: g.color }}
                          >
                            <Target className="size-5" />
                          </div>
                          <div>
                            <div className="text-base font-semibold">
                              {g.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {g.target_date ? (
                                <>
                                  Até {formatDate(g.target_date)}{" "}
                                  {daysLeft != null && daysLeft >= 0 && (
                                    <span>· {daysLeft}d restantes</span>
                                  )}
                                </>
                              ) : (
                                "Sem data alvo"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0">
                          {done && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-success/40 text-[10px] text-success"
                            >
                              <Trophy className="size-3" />
                              Concluída
                            </Badge>
                          )}
                          <EditGoalButton goal={g} />
                          <DeleteButton
                            confirmText={`Excluir meta "${g.name}"?`}
                            action={async () => {
                              "use server";
                              return await deleteGoal(g.id);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <CardContent className="space-y-3 p-5">
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-xl font-semibold tabular-nums">
                              {formatCurrency(current)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {" "}
                              de {formatCurrency(target)}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-medium tabular-nums ${
                              done ? "text-success" : ""
                            }`}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: g.color,
                            }}
                          />
                        </div>
                        {!done && (
                          <div className="text-[11px] text-muted-foreground">
                            Faltam {formatCurrency(remaining)}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border/60 pt-3">
                        <div className="mb-1.5 text-[11px] text-muted-foreground">
                          Registrar depósito ou retirada
                        </div>
                        <GoalQuickAdd goalId={g.id} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
