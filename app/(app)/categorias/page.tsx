import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/database";
import { CategoryDialog, EditCategoryButton } from "./category-dialog";
import { DeleteButton } from "./delete-button";
import { deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

const essentialityLabel: Record<string, string> = {
  essencial: "Essencial",
  superfluo: "Supérfluo",
  neutro: "Neutro",
};

const typeLabel: Record<string, string> = {
  despesa: "Despesa",
  receita: "Receita",
  transferencia: "Transferência",
};

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("name");

  const categories = (data ?? []) as Category[];
  const roots = categories.filter((c) => !c.parent_id);
  const children = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const despesa = roots.filter((c) => c.type === "despesa");
  const receita = roots.filter((c) => c.type === "receita");

  const renderCard = (c: Category) => (
    <div
      key={c.id}
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: c.color }}
          />
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            <div className="text-xs text-muted-foreground">
              {typeLabel[c.type]} · {essentialityLabel[c.essentiality]}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0">
          <EditCategoryButton category={c} parents={roots} />
          <DeleteButton
            confirmText={`Excluir "${c.name}"? Transações desta categoria ficarão sem categoria.`}
            action={async () => {
              "use server";
              return await deleteCategory(c.id);
            }}
          />
        </div>
      </div>
      {children(c.id).length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {children(c.id).map((sub) => (
            <Badge
              key={sub.id}
              variant="outline"
              className="gap-1.5 border-border/60 pl-1.5"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: sub.color }}
              />
              {sub.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Organize suas receitas e despesas.
          </p>
        </div>
        <CategoryDialog parents={roots} />
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Despesas</CardTitle>
          <CardDescription>
            {despesa.length} categoria{despesa.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {despesa.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria de despesa.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {despesa.map(renderCard)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Receitas</CardTitle>
          <CardDescription>
            {receita.length} categoria{receita.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receita.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria de receita.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {receita.map(renderCard)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
