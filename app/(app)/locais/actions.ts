"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { placeSchema } from "@/lib/validations";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return { supabase, userId: data.user.id };
}

export async function createPlace(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  if (raw.notes === "") raw.notes = null;
  const parsed = placeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase.from("places").insert({
    ...parsed.data,
    user_id: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/locais");
  return { success: true };
}

export async function updatePlace(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  if (raw.notes === "") raw.notes = null;
  const parsed = placeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase
    .from("places")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/locais");
  return { success: true };
}

export async function deletePlace(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/locais");
  return { success: true };
}
