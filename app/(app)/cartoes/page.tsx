import {
  CreditCard as CreditCardIcon,
  CalendarClock,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { currentOpenInvoice, daysUntil } from "@/lib/credit-card";
import type { CreditCard, Transaction } from "@/types/database";
import { CardDialog, EditCardButton } from "./card-dialog";
import { DeleteButton } from "../categorias/delete-button";
import { deleteCreditCard } from "./actions";

export const dynamic = "force-dynamic";

export default async function CartoesPage() {
  const supabase = await createClient();

  const { data: cardsData } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("archived", false)
    .order("name");
  const cards = (cardsData ?? []) as CreditCard[];

  // Buscar transações de cartão (todas despesas com credit_card_id)
  // Filtramos depois por janela de cada cartão
  const { data: txData } = await supabase
    .from("transactions")
    .select("id,credit_card_id,amount,description,occurred_at,status,type")
    .eq("type", "despesa")
    .not("credit_card_id", "is", null)
    .order("occurred_at", { ascending: false });
  const txs = (txData ?? []) as Transaction[];

  const totalLimit = cards.reduce((a, b) => a + Number(b.credit_limit || 0), 0);

  // Calcular totais por cartão
  const cardStats = cards.map((card) => {
    const open = currentOpenInvoice(card.closing_day, card.due_day);
    const cardTx = txs.filter((t) => t.credit_card_id === card.id);
    const invoiceTx = cardTx.filter((t) => {
      const d = new Date(t.occurred_at);
      return (
        d >= open.periodStart && d <= open.closingDate && t.status !== "cancelado"
      );
    });
    const invoiceTotal = invoiceTx.reduce(
      (a, b) => a + Number(b.amount || 0),
      0,
    );
    const utilPct =
      card.credit_limit > 0 ? (invoiceTotal / card.credit_limit) * 100 : 0;
    const daysToClose = daysUntil(open.closingDate);
    const daysToDue = daysUntil(open.dueDate);

    return {
      card,
      open,
      invoiceTx,
      invoiceTotal,
      utilPct,
      daysToClose,
      daysToDue,
    };
  });

  const totalFaturas = cardStats.reduce((a, b) => a + b.invoiceTotal, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Cartões de crédito
          </h2>
          <p className="text-sm text-muted-foreground">
            Faturas em aberto e limites.
          </p>
        </div>
        <CardDialog />
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
            <div className="text-xs text-muted-foreground">
              Em aberto agora
            </div>
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
              open,
              invoiceTx,
              invoiceTotal,
              utilPct,
              daysToClose,
              daysToDue,
            }) => (
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
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {open.label}
                      </div>
                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px]"
                      >
                        <CalendarClock className="size-3" />
                        {daysToClose > 0
                          ? `fecha em ${daysToClose}d`
                          : `fechou há ${Math.abs(daysToClose)}d`}
                      </Badge>
                    </div>
                    <div className="text-2xl font-semibold tabular-nums text-danger">
                      {formatCurrency(invoiceTotal)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Janela: {formatDate(open.periodStart)} →{" "}
                      {formatDate(open.closingDate)} · vence em{" "}
                      {formatDate(open.dueDate)} (
                      {daysToDue > 0 ? `${daysToDue}d` : `há ${Math.abs(daysToDue)}d`}
                      )
                    </div>
                  </div>

                  {/* Utilização do limite */}
                  {card.credit_limit > 0 && (
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
                      <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
                        {invoiceTx.slice(0, 10).map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {t.description}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {formatDate(t.occurred_at)}
                              </div>
                            </div>
                            <div className="shrink-0 font-semibold tabular-nums">
                              {formatCurrency(Number(t.amount))}
                            </div>
                          </li>
                        ))}
                        {invoiceTx.length > 10 && (
                          <li className="text-center text-[10px] text-muted-foreground">
                            + {invoiceTx.length - 10} lançamentos
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}
