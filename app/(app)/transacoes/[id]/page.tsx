import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/transaction-form";
import type {
  Account,
  Category,
  CreditCard,
  Place,
  Transaction,
} from "@/types/database";

export const dynamic = "force-dynamic";

export default async function EditTransacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [tx, cats, accs, places, cards] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).single(),
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

  if (!tx.data) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Editar transação</h2>
      </div>
      <TransactionForm
        mode="edit"
        transaction={tx.data as Transaction}
        categories={(cats.data ?? []) as Category[]}
        accounts={(accs.data ?? []) as Account[]}
        places={(places.data ?? []) as Place[]}
        creditCards={(cards.data ?? []) as CreditCard[]}
      />
    </div>
  );
}
