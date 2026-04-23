"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    throw new Error("Acesso restrito a admins");
  }
  return supabase;
}

export async function promoteUser(userId: string) {
  const supabase = await ensureAdmin();
  const { error } = await supabase.rpc("admin_promote", { p_user_id: userId });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function demoteUser(userId: string) {
  const supabase = await ensureAdmin();
  const { error } = await supabase.rpc("admin_demote", { p_user_id: userId });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}
