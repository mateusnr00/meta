import Link from "next/link";
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { TransactionFilters } from "./filters";
import { TransactionActionsMenu } from "./transaction-actions-menu";
import { ExportCsvButton } from "./export-csv-button";
import type {
  Account,
  Category,
  TransactionWithRelations,
} from "@/types/database";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TransacoesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(
      "id,type,amount,description,occurred_at,status,essentiality,payment_method,excluded_from_stats,category:categories!transactions_category_id_fkey(id,name,color,essentiality),account:accounts!transactions_account_id_fkey(id,name,color),place:places(id,name),credit_card:credit_cards(id,name,color)",
    )
    .order("occurred_at", { ascending: false })
    .limit(200);

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const type = typeof sp.type === "string" ? sp.type : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const account = typeof sp.account === "string" ? sp.account : undefined;

  if (q) query = query.ilike("description", `%${q}%`);
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category_id", category);
  if (account) query = query.eq("account_id", account);

  const [txs, cats, accs] = await Promise.all([
    query,
    supabase
      .from("categories")
      .select("*")
      .eq("archived", false)
      .order("name"),
    supabase
      .from("accounts")
      .select("*")
      .eq("archived", false)
      .order("name"),
  ]);

  const transactions = (txs.data ?? []) as unknown as TransactionWithRelations[];

  const totalReceitas = transactions
    .filter((t) => t.type === "receita")
    .reduce((a, b) => a + Number(b.amount), 0);
  const totalDespesas = transactions
    .filter((t) => t.type === "despesa")
    .reduce((a, b) => a + Number(b.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Transações</h2>
          <p className="text-sm text-muted-foreground">
            {transactions.length} lançamento
            {transactions.length === 1 ? "" : "s"} no período
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton />
          <Link
            href="/transacoes/nova"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova transação</span>
            <span className="sm:hidden">Nova</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs text-muted-foreground">Entradas</div>
              <div className="text-lg font-semibold text-success tabular-nums">
                {formatCurrency(totalReceitas)}
              </div>
            </div>
            <ArrowUpRight className="size-5 text-success" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs text-muted-foreground">Saídas</div>
              <div className="text-lg font-semibold text-danger tabular-nums">
                {formatCurrency(totalDespesas)}
              </div>
            </div>
            <ArrowDownRight className="size-5 text-danger" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-xs text-muted-foreground">Resultado</div>
              <div
                className={`text-lg font-semibold tabular-nums ${
                  totalReceitas - totalDespesas >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {formatCurrency(totalReceitas - totalDespesas)}
              </div>
            </div>
            <ArrowRightLeft className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionFilters
            categories={(cats.data ?? []) as Category[]}
            accounts={(accs.data ?? []) as Account[]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-2 text-sm text-muted-foreground">
                Nenhuma transação encontrada.
              </div>
              <Link
                href="/transacoes/nova"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Cadastrar primeira
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[110px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(t.occurred_at)}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">
                          {t.description}
                        </span>
                        {t.excluded_from_stats ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-muted-foreground/40 px-1.5 py-0 text-[9px] text-muted-foreground"
                            title="Fora das análises"
                          >
                            fora das análises
                          </Badge>
                        ) : null}
                      </div>
                      {t.place?.name ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {t.place.name}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t.category ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: t.category.color }}
                          />
                          <span className="text-sm">{t.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {t.credit_card ? (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="gap-1.5 border-primary/30 pl-1.5 text-[10px]"
                            style={{ color: t.credit_card.color }}
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: t.credit_card.color }}
                            />
                            Crédito · {t.credit_card.name}
                          </Badge>
                        </div>
                      ) : t.payment_method ? (
                        <Badge
                          variant="outline"
                          className="gap-1 text-[10px] capitalize"
                        >
                          {t.payment_method}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          t.status === "pago"
                            ? "default"
                            : t.status === "pendente"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${
                        t.type === "receita"
                          ? "text-success"
                          : t.type === "despesa"
                          ? "text-danger"
                          : ""
                      }`}
                    >
                      {t.type === "despesa" ? "-" : t.type === "receita" ? "+" : ""}
                      {formatCurrency(Number(t.amount))}
                    </TableCell>
                    <TableCell>
                      <TransactionActionsMenu
                        id={t.id}
                        excluded={t.excluded_from_stats ?? false}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
