"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { creditCardSchema } from "@/lib/validations";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return { supabase, userId: data.user.id };
}

function normalize(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  if (raw.brand === "" || raw.brand === undefined) raw.brand = null;
  return raw;
}

export async function createCreditCard(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const parsed = creditCardSchema.safeParse(normalize(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase.from("credit_cards").insert({
    ...parsed.data,
    brand: parsed.data.brand ?? null,
    user_id: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/cartoes");
  return { success: true };
}

export async function updateCreditCard(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const parsed = creditCardSchema.safeParse(normalize(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase
    .from("credit_cards")
    .update({ ...parsed.data, brand: parsed.data.brand ?? null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cartoes");
  return { success: true };
}

export async function deleteCreditCard(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cartoes");
  return { success: true };
}
