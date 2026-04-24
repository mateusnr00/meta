import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoriesBar } from "@/components/charts/categories-bar";
import { MonthlyBar } from "@/components/charts/monthly-bar";
import {
  formatCurrency,
  shortMonthLabel,
  weekdayLabel,
} from "@/lib/format";
import type { TransactionWithRelations } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const now = new Date();
  // últimos 6 meses
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const { data } = await supabase
    .from("transactions")
    .select(
      "id,type,amount,occurred_at,essentiality,description,category:categories!transactions_category_id_fkey(id,name,color,essentiality),place:places(id,name)",
    )
    .gte("occurred_at", sixMonthsAgo.toISOString())
    .eq("status", "pago")
    .eq("excluded_from_stats", false)
    .order("occurred_at", { ascending: true });

  const txs = (data ?? []) as unknown as TransactionWithRelations[];

  // Evolução mensal
  const monthlyMap = new Map<
    string,
    { label: string; receitas: number; despesas: number }
  >();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, {
      label: `${shortMonthLabel(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`,
      receitas: 0,
      despesas: 0,
    });
  }
  for (const t of txs) {
    const d = new Date(t.occurred_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const entry = monthlyMap.get(key);
    if (!entry) continue;
    if (t.type === "receita") entry.receitas += Number(t.amount);
    if (t.type === "despesa") entry.despesas += Number(t.amount);
  }
  const monthlyData = [...monthlyMap.values()];

  // Mês atual — categorias
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTx = txs.filter(
    (t) => new Date(t.occurred_at) >= monthStart,
  );
  const catMap = new Map<
    string,
    { name: string; value: number; color: string }
  >();
  for (const t of thisMonthTx) {
    if (t.type !== "despesa" || !t.category) continue;
    const cur = catMap.get(t.category.id);
    if (cur) cur.value += Number(t.amount);
    else
      catMap.set(t.category.id, {
        name: t.category.name,
        value: Number(t.amount),
        color: t.category.color,
      });
  }
  const catData = [...catMap.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Ranking de locais (mês atual)
  const placeMap = new Map<string, number>();
  for (const t of thisMonthTx) {
    if (t.type !== "despesa" || !t.place) continue;
    placeMap.set(
      t.place.id,
      (placeMap.get(t.place.id) ?? 0) + Number(t.amount),
    );
  }
  const placeNames = new Map<string, string>();
  for (const t of thisMonthTx) {
    if (t.place) placeNames.set(t.place.id, t.place.name);
  }
  const topPlaces = [...placeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, value]) => ({ id, name: placeNames.get(id) ?? "Local", value }));

  // Gastos por dia da semana (mês atual)
  const weekdayMap = new Map<number, number>();
  for (let i = 0; i < 7; i++) weekdayMap.set(i, 0);
  for (const t of thisMonthTx) {
    if (t.type !== "despesa") continue;
    const d = new Date(t.occurred_at).getDay();
    weekdayMap.set(d, (weekdayMap.get(d) ?? 0) + Number(t.amount));
  }

  const maxWeekday = Math.max(1, ...[...weekdayMap.values()]);

  // Totais do mês
  const totalRec = thisMonthTx
    .filter((t) => t.type === "receita")
    .reduce((a, b) => a + Number(b.amount), 0);
  const totalDesp = thisMonthTx
    .filter((t) => t.type === "despesa")
    .reduce((a, b) => a + Number(b.amount), 0);

  // Média diária do mês
  const diasCorridos = Math.max(1, now.getDate());
  const mediaDiaria = totalDesp / diasCorridos;
  const ticketMedio =
    thisMonthTx.filter((t) => t.type === "despesa").length > 0
      ? totalDesp /
        thisMonthTx.filter((t) => t.type === "despesa").length
      : 0;

  // Essencialidade
  const essencialTotal = thisMonthTx
    .filter(
      (t) =>
        t.type === "despesa" &&
        (t.essentiality === "essencial" ||
          t.category?.essentiality === "essencial"),
    )
    .reduce((a, b) => a + Number(b.amount), 0);
  const superfluoTotal = thisMonthTx
    .filter(
      (t) =>
        t.type === "despesa" &&
        (t.essentiality === "superfluo" ||
          t.category?.essentiality === "superfluo"),
    )
    .reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Relatórios</h2>
        <p className="text-sm text-muted-foreground">
          Análises detalhadas da sua vida financeira dos últimos 6 meses.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Evolução mensal</CardTitle>
          <CardDescription>
            Receitas × despesas nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyBar data={monthlyData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Média diária</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-danger">
              {formatCurrency(mediaDiaria)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              (despesas / dias)
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Ticket médio</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(ticketMedio)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              por transação
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Essenciais</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-info">
              {formatCurrency(essencialTotal)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {totalDesp > 0
                ? `${((essencialTotal / totalDesp) * 100).toFixed(0)}% das despesas`
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Supérfluos</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-danger">
              {formatCurrency(superfluoTotal)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {totalDesp > 0
                ? `${((superfluoTotal / totalDesp) * 100).toFixed(0)}% das despesas`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Top categorias</CardTitle>
            <CardDescription>Maiores gastos do mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoriesBar data={catData} />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Ranking de locais</CardTitle>
            <CardDescription>
              Onde mais gastou no mês ({formatCurrency(totalDesp)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPlaces.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Sem dados no período.
              </div>
            ) : (
              <ul className="space-y-3">
                {topPlaces.map((p, i) => {
                  const pct = totalDesp > 0 ? (p.value / totalDesp) * 100 : 0;
                  return (
                    <li key={p.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(p.value)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-danger"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Gastos por dia da semana</CardTitle>
          <CardDescription>Padrão de consumo — mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {[...weekdayMap.entries()].map(([day, value]) => {
              const pct = (value / maxWeekday) * 100;
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <div className="relative flex h-32 w-full items-end overflow-hidden rounded-lg bg-muted/40">
                    <div
                      className="w-full rounded-t-lg bg-danger/80 transition-all"
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">
                      {weekdayLabel(day)}
                    </div>
                    <div className="text-[11px] tabular-nums text-muted-foreground">
                      {formatCurrency(value)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Resumo do mês</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Receitas</div>
            <div className="text-base font-semibold text-success tabular-nums">
              {formatCurrency(totalRec)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Despesas</div>
            <div className="text-base font-semibold text-danger tabular-nums">
              {formatCurrency(totalDesp)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Saldo</div>
            <div
              className={`text-base font-semibold tabular-nums ${
                totalRec - totalDesp >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(totalRec - totalDesp)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Transações</div>
            <div className="text-base font-semibold tabular-nums">
              {thisMonthTx.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
