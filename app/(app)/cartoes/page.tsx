import {
  CreditCard as CreditCardIcon,
  CalendarClock,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthNav } from "@/components/month-nav";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  invoiceForDueMonth,
  currentOpenInvoice,
  daysUntil,
} from "@/lib/credit-card";
import type { CreditCard, Transaction } from "@/types/database";
import { CardDialog, EditCardButton } from "./card-dialog";
import { DeleteButton } from "../categorias/delete-button";
import { deleteCreditCard } from "./actions";

export const dynamic = "force-dynamic";

interface SearchParams {
  m?: string;
  y?: string;
}

export default async function CartoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const now = new Date();

  const supabase = await createClient();

  const { data: cardsData } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("archived", false)
    .order("name");
  const cards = (cardsData ?? []) as CreditCard[];

  const { data: txData } = await supabase
    .from("transactions")
    .select("id,credit_card_id,amount,description,occurred_at,status,type,category:categories!transactions_category_id_fkey(id,name,color)")
    .eq("type", "despesa")
    .not("credit_card_id", "is", null)
    .order("occurred_at", { ascending: false });
  const txs = (txData ?? []) as unknown as (Transaction & {
    category?: { id: string; name: string; color: string } | null;
  })[];

  // Default do mês: fatura que contém a transação mais recente (entre todos os
  // cartões). Se não houver transações, usa a próxima fatura a vencer do
  // primeiro cartão.
  let targetMonth = Number(sp.m);
  let targetYear = Number(sp.y);
  if (!targetMonth || !targetYear) {
    if (txs.length > 0 && cards.length > 0) {
      const mostRecent = txs[0];
      const card =
        cards.find((c) => c.id === mostRecent.credit_card_id) ?? cards[0];
      const occurred = new Date(mostRecent.occurred_at);
      const closingDay = card.closing_day;
      const dueDay = card.due_day;
      let m = occurred.getMonth();
      let y = occurred.getFullYear();
      if (occurred.getDate() > closingDay) m += 1;
      if (dueDay <= closingDay) m += 1;
      while (m > 11) {
        m -= 12;
        y += 1;
      }
      targetMonth = m + 1;
      targetYear = y;
    } else if (cards.length > 0) {
      const next = currentOpenInvoice(
        cards[0].closing_day,
        cards[0].due_day,
        now,
      );
      targetMonth = next.dueDate.getMonth() + 1;
      targetYear = next.dueDate.getFullYear();
    } else {
      targetMonth = now.getMonth() + 1;
      targetYear = now.getFullYear();
    }
  }

  const totalLimit = cards.reduce((a, b) => a + Number(b.credit_limit || 0), 0);

  const cardStats = cards.map((card) => {
    const invoice = invoiceForDueMonth(
      targetMonth,
      targetYear,
      card.closing_day,
      card.due_day,
    );
    const cardTx = txs.filter((t) => t.credit_card_id === card.id);
    const invoiceTx = cardTx.filter((t) => {
      const d = new Date(t.occurred_at);
      return (
        d >= invoice.periodStart &&
        d <= invoice.closingDate &&
        t.status !== "cancelado"
      );
    });
    const invoiceTotal = invoiceTx.reduce(
      (a, b) => a + Number(b.amount || 0),
      0,
    );
    const utilPct =
      card.credit_limit > 0 ? (invoiceTotal / card.credit_limit) * 100 : 0;
    const daysToClose = daysUntil(invoice.closingDate, now);
    const daysToDue = daysUntil(invoice.dueDate, now);
    const isPaid = daysToDue < -3 && invoiceTx.length === 0;

    return {
      card,
      invoice,
      invoiceTx,
      invoiceTotal,
      utilPct,
      daysToClose,
      daysToDue,
      isPaid,
    };
  });

  const totalFaturas = cardStats.reduce((a, b) => a + b.invoiceTotal, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Cartões de crédito
          </h2>
          <p className="text-sm text-muted-foreground">
            Faturas do período selecionado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthNav month={targetMonth} year={targetYear} basePath="/cartoes" />
          <CardDialog />
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Cartões ativos</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {cards.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Limite total</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(totalLimit)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Fatura do mês</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-danger">
              {formatCurrency(totalFaturas)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Utilização</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {totalLimit > 0
                ? `${((totalFaturas / totalLimit) * 100).toFixed(0)}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <CreditCardIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">
                Nenhum cartão cadastrado
              </h3>
              <p className="text-xs text-muted-foreground">
                Cadastre um cartão para começar a rastrear faturas.
              </p>
            </div>
            <CardDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cardStats.map(
            ({
              card,
              invoice,
              invoiceTx,
              invoiceTotal,
              utilPct,
              daysToClose,
              daysToDue,
            }) => {
              const isClosed = daysToClose <= 0;
              const isDue = daysToDue <= 0;
              return (
                <Card
                  key={card.id}
                  className="overflow-hidden border-border/60"
                >
                  {/* Topo colorido */}
                  <div
                    className="relative px-5 pt-5 pb-4"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklab, ${card.color} 35%, var(--card)), color-mix(in oklab, ${card.color} 10%, var(--card)))`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-xl text-white shadow-lg"
                          style={{ backgroundColor: card.color }}
                        >
                          <CreditCardIcon className="size-5" />
                        </div>
                        <div>
                          <div className="text-base font-semibold">
                            {card.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {card.brand ?? "Cartão"} · fecha dia{" "}
                            {card.closing_day} · vence dia {card.due_day}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0">
                        <EditCardButton card={card} />
                        <DeleteButton
                          confirmText={`Excluir cartão "${card.name}"? Transações vinculadas ficarão sem cartão.`}
                          action={async () => {
                            "use server";
                            return await deleteCreditCard(card.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-4 p-5">
                    {/* Fatura */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="text-xs text-muted-foreground">
                          {invoice.label}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="gap-1 text-[10px]"
                          >
                            <CalendarClock className="size-3" />
                            {isClosed
                              ? `fechou ${formatDate(invoice.closingDate)}`
                              : `fecha em ${daysToClose}d`}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-2xl font-semibold tabular-nums text-danger">
                        {formatCurrency(invoiceTotal)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Janela: {formatDate(invoice.periodStart)} →{" "}
                        {formatDate(invoice.closingDate)} ·{" "}
                        {isDue
                          ? `venceu em ${formatDate(invoice.dueDate)}`
                          : `vence ${formatDate(invoice.dueDate)} (${daysToDue}d)`}
                      </div>
                    </div>

                    {/* Utilização do limite */}
                    {card.credit_limit > 0 && invoiceTotal > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Utilização
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(invoiceTotal)} /{" "}
                            {formatCurrency(card.credit_limit)} ·{" "}
                            {utilPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilPct > 90
                                ? "bg-danger"
                                : utilPct > 70
                                ? "bg-warning"
                                : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(100, utilPct)}%` }}
                          />
                        </div>
                        {utilPct > 90 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-danger">
                            <AlertCircle className="size-3" />
                            Limite quase estourado
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lançamentos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Receipt className="size-3" />
                          Lançamentos da fatura ({invoiceTx.length})
                        </span>
                      </div>
                      {invoiceTx.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 py-4 text-center text-xs text-muted-foreground">
                          Nenhum lançamento nesta fatura.
                        </div>
                      ) : (
                        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
                          {invoiceTx.map((t) => (
                            <li
                              key={t.id}
                              className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 text-xs"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                {t.category ? (
                                  <span
                                    className="size-2 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: t.category.color,
                                    }}
                                  />
                                ) : null}
                                <div className="min-w-0">
                                  <div className="truncate font-medium">
                                    {t.description}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {formatDate(t.occurred_at)}
                                    {t.category
                                      ? ` · ${t.category.name}`
                                      : ""}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 font-semibold tabular-nums">
                                {formatCurrency(Number(t.amount))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
