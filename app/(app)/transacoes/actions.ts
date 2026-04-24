"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validations";

function normalizeFormData(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());

  // Normalize nullable uuid fields: treat "" as null
  for (const key of [
    "category_id",
    "subcategory_id",
    "place_id",
    "account_id",
    "destination_account_id",
    "credit_card_id",
    "payment_method",
    "notes",
  ]) {
    if (raw[key] === "" || raw[key] === undefined) raw[key] = null;
  }

  const tagsRaw = String(formData.get("tags") ?? "").trim();
  raw.tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const inst = String(formData.get("installment_total") ?? "").trim();
  raw.installment_total = inst ? Number(inst) : null;

  return raw;
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, userId: user.id };
}

export async function createTransaction(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const parsed = transactionSchema.safeParse(normalizeFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const input = parsed.data;

  if (
    input.type === "transferencia" &&
    (!input.account_id || !input.destination_account_id)
  ) {
    return { error: "Transferência exige conta de origem e destino." };
  }

  const total = input.installment_total ?? 1;

  if (total > 1 && input.type !== "transferencia") {
    // Cria N parcelas
    const groupId = crypto.randomUUID();
    const valor = Math.round((input.amount / total) * 100) / 100;
    const base = new Date(input.occurred_at);
    const rows = Array.from({ length: total }, (_, i) => {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      return {
        user_id: userId,
        type: input.type,
        amount: valor,
        description: `${input.description} (${i + 1}/${total})`,
        category_id: input.category_id ?? null,
        subcategory_id: input.subcategory_id ?? null,
        place_id: input.place_id ?? null,
        account_id: input.account_id ?? null,
        destination_account_id: null,
        credit_card_id: input.credit_card_id ?? null,
        payment_method: input.payment_method ?? null,
        status: i === 0 ? input.status : "pendente",
        essentiality: input.essentiality,
        tags: input.tags,
        notes: input.notes ?? null,
        occurred_at: d.toISOString(),
        installment_number: i + 1,
        installment_total: total,
        installment_group_id: groupId,
        excluded_from_stats: input.excluded_from_stats ?? false,
      };
    });
    const { error } = await supabase.from("transactions").insert(rows);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      category_id: input.category_id ?? null,
      subcategory_id: input.subcategory_id ?? null,
      place_id: input.place_id ?? null,
      account_id: input.account_id ?? null,
      destination_account_id: input.destination_account_id ?? null,
      credit_card_id: input.credit_card_id ?? null,
      payment_method: input.payment_method ?? null,
      status: input.status,
      essentiality: input.essentiality,
      tags: input.tags,
      notes: input.notes ?? null,
      occurred_at: new Date(input.occurred_at).toISOString(),
      excluded_from_stats: input.excluded_from_stats ?? false,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/transacoes");
  redirect("/transacoes");
}

export async function updateTransaction(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const parsed = transactionSchema.safeParse(normalizeFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const input = parsed.data;

  const { error } = await supabase
    .from("transactions")
    .update({
      type: input.type,
      amount: input.amount,
      description: input.description,
      category_id: input.category_id ?? null,
      subcategory_id: input.subcategory_id ?? null,
      place_id: input.place_id ?? null,
      account_id: input.account_id ?? null,
      destination_account_id: input.destination_account_id ?? null,
      credit_card_id: input.credit_card_id ?? null,
      payment_method: input.payment_method ?? null,
      status: input.status,
      essentiality: input.essentiality,
      tags: input.tags,
      notes: input.notes ?? null,
      occurred_at: new Date(input.occurred_at).toISOString(),
      excluded_from_stats: input.excluded_from_stats ?? false,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transacoes");
  redirect("/transacoes");
}

export async function deleteTransaction(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/transacoes");
  return { success: true };
}

export async function toggleExcludedFromStats(id: string) {
  const { supabase } = await getUserId();
  const { data: cur } = await supabase
    .from("transactions")
    .select("excluded_from_stats")
    .eq("id", id)
    .single();
  if (!cur) return { error: "Transação não encontrada" };
  const { error } = await supabase
    .from("transactions")
    .update({ excluded_from_stats: !cur.excluded_from_stats })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/transacoes");
  revalidatePath("/relatorios");
  revalidatePath("/contas");
  return { success: true, excluded: !cur.excluded_from_stats };
}

export async function duplicateTransaction(id: string) {
  const { supabase, userId } = await getUserId();
  const { data: src } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();
  if (!src) return { error: "Transação não encontrada" };

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: src.type,
    amount: src.amount,
    description: `${src.description} (cópia)`,
    category_id: src.category_id,
    subcategory_id: src.subcategory_id,
    place_id: src.place_id,
    account_id: src.account_id,
    destination_account_id: src.destination_account_id,
    credit_card_id: src.credit_card_id,
    payment_method: src.payment_method,
    status: src.status,
    essentiality: src.essentiality,
    tags: src.tags,
    notes: src.notes,
    occurred_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/transacoes");
  return { success: true };
}
