import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Account, AccountBalance } from "@/types/database";
import { AccountDialog, EditAccountButton } from "./account-dialog";
import { DeleteButton } from "../categorias/delete-button";
import { deleteAccount } from "./actions";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  carteira: "Carteira",
  investimento: "Investimento",
  credito: "Cartão de crédito",
  outro: "Outro",
};

export default async function ContasPage() {
  const supabase = await createClient();
  const [accs, bals] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("v_account_balances").select("*"),
  ]);

  const accounts = (accs.data ?? []) as Account[];
  const balances = (bals.data ?? []) as AccountBalance[];
  const balanceMap = new Map(balances.map((b) => [b.account_id, Number(b.balance)]));
  const total = balances.reduce((a, b) => a + Number(b.balance), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Contas</h2>
          <p className="text-sm text-muted-foreground">
            Onde seu dinheiro está distribuído.
          </p>
        </div>
        <AccountDialog />
      </div>

      <Card className="border-border/60 gradient-info">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Saldo total
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatCurrency(total)}
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-info/15 text-info">
            <Wallet className="size-5" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <Card className="col-span-full border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Você ainda não tem contas.
            </CardContent>
          </Card>
        ) : (
          accounts.map((a) => {
            const bal = balanceMap.get(a.id) ?? a.initial_balance;
            return (
              <Card
                key={a.id}
                className="border-border/60 transition-colors hover:border-border"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="mt-0.5 size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: a.color }}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {typeLabel[a.type]}
                        </div>
                      </div>
                    </div>
                    {a.archived ? (
                      <Badge variant="outline" className="text-[10px]">
                        arquivada
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-[11px] text-muted-foreground">
                      Saldo atual
                    </div>
                    <div
                      className={`text-lg font-semibold tabular-nums ${
                        bal >= 0 ? "" : "text-danger"
                      }`}
                    >
                      {formatCurrency(bal)}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                    <EditAccountButton account={a} />
                    <DeleteButton
                      confirmText={`Excluir "${a.name}"? As transações vinculadas ficarão sem conta.`}
                      action={async () => {
                        "use server";
                        return await deleteAccount(a.id);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
