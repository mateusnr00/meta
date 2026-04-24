"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema, goalSchema } from "@/lib/validations";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Não autenticado");
  return { supabase, userId: data.user.id };
}

// ============================================================================
// Budgets (orçamentos)
// ============================================================================

export async function upsertBudget(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  const parsed = budgetSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        ...parsed.data,
        user_id: userId,
      },
      { onConflict: "user_id,category_id,month,year" },
    );
  if (error) return { error: error.message };
  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBudget(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

// ============================================================================
// Goals (metas)
// ============================================================================

function normalizeGoal(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries());
  if (raw.target_date === "" || raw.target_date === undefined)
    raw.target_date = null;
  return raw;
}

export async function createGoal(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const parsed = goalSchema.safeParse(normalizeGoal(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase.from("goals").insert({
    ...parsed.data,
    target_date: parsed.data.target_date ?? null,
    user_id: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/metas");
  return { success: true };
}

export async function updateGoal(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const parsed = goalSchema.safeParse(normalizeGoal(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase
    .from("goals")
    .update({
      ...parsed.data,
      target_date: parsed.data.target_date ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/metas");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/metas");
  return { success: true };
}

export async function addToGoal(id: string, delta: number) {
  const { supabase } = await getUserId();
  const { data: goal } = await supabase
    .from("goals")
    .select("current_amount,target_amount")
    .eq("id", id)
    .single();
  if (!goal) return { error: "Meta não encontrada" };
  const next = Math.max(0, Number(goal.current_amount) + delta);
  const { error } = await supabase
    .from("goals")
    .update({ current_amount: next })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/metas");
  return { success: true };
}
