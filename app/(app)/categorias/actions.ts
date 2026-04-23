"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return { supabase, userId: data.user.id };
}

export async function createCategory(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  if (raw.parent_id === "" || raw.parent_id === "none") raw.parent_id = null;

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase.from("categories").insert({
    ...parsed.data,
    parent_id: parsed.data.parent_id ?? null,
    user_id: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/categorias");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  if (raw.parent_id === "" || raw.parent_id === "none") raw.parent_id = null;

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase
    .from("categories")
    .update({
      ...parsed.data,
      parent_id: parsed.data.parent_id ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/categorias");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/categorias");
  return { success: true };
}
