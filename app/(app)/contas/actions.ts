"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountSchema } from "@/lib/validations";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return { supabase, userId: data.user.id };
}

export async function createAccount(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase.from("accounts").insert({
    ...parsed.data,
    user_id: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/contas");
  revalidatePath("/");
  return { success: true };
}

export async function updateAccount(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase
    .from("accounts")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contas");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAccount(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contas");
  revalidatePath("/");
  return { success: true };
}
