import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/transaction-form";
import type { Account, Category, CreditCard, Place } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NovaTransacaoPage() {
  const supabase = await createClient();
  const [cats, accs, places, cards] = await Promise.all([
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
    supabase.from("places").select("*").eq("archived", false).order("name"),
    supabase
      .from("credit_cards")
      .select("*")
      .eq("archived", false)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Nova transação</h2>
        <p className="text-sm text-muted-foreground">
          Registre uma receita, despesa ou transferência.
        </p>
      </div>
      <TransactionForm
        mode="create"
        categories={(cats.data ?? []) as Category[]}
        accounts={(accs.data ?? []) as Account[]}
        places={(places.data ?? []) as Place[]}
        creditCards={(cards.data ?? []) as CreditCard[]}
      />
    </div>
  );
}
