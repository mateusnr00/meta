import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = sp.get("q") ?? undefined;
  const type = sp.get("type") ?? undefined;
  const category = sp.get("category") ?? undefined;
  const account = sp.get("account") ?? undefined;

  let query = supabase
    .from("transactions")
    .select(
      "id,type,amount,description,occurred_at,status,essentiality,payment_method,excluded_from_stats,category:categories!transactions_category_id_fkey(name),account:accounts!transactions_account_id_fkey(name),place:places(name),credit_card:credit_cards(name)",
    )
    .order("occurred_at", { ascending: false });

  if (q) query = query.ilike("description", `%${q}%`);
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category_id", category);
  if (account) query = query.eq("account_id", account);

  const { data, error } = await query;
  if (error) {
    return new NextResponse(`Erro: ${error.message}`, { status: 500 });
  }

  const headers = [
    "Data",
    "Tipo",
    "Descrição",
    "Categoria",
    "Conta",
    "Cartão",
    "Local",
    "Pagamento",
    "Status",
    "Essencialidade",
    "Fora das análises",
    "Valor",
  ];

  type Named = { name: string } | { name: string }[] | null;
  function pickName(rel: Named | undefined): string {
    if (!rel) return "";
    if (Array.isArray(rel)) return rel[0]?.name ?? "";
    return rel.name ?? "";
  }

  const rows = (data ?? []).map((t) => {
    const date = new Date(t.occurred_at).toLocaleDateString("pt-BR");
    const valor = Number(t.amount).toFixed(2).replace(".", ",");
    return [
      date,
      t.type,
      t.description,
      pickName(t.category as Named | undefined),
      pickName(t.account as Named | undefined),
      pickName(t.credit_card as Named | undefined),
      pickName(t.place as Named | undefined),
      t.payment_method ?? "",
      t.status,
      t.essentiality,
      t.excluded_from_stats ? "sim" : "não",
      `${t.type === "despesa" ? "-" : ""}${valor}`,
    ].map(csvEscape).join(";");
  });

  // BOM para Excel reconhecer UTF-8 corretamente
  const csv = "﻿" + headers.join(";") + "\n" + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="meta-transacoes.csv"`,
    },
  });
}
