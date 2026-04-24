import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, startOfMonth, endOfMonth } from "@/lib/format";
import type { Place } from "@/types/database";
import { PlaceDialog, EditPlaceButton } from "./place-dialog";
import { DeleteButton } from "../categorias/delete-button";
import { deletePlace } from "./actions";

export const dynamic = "force-dynamic";

export default async function LocaisPage() {
  const supabase = await createClient();
  const monthStart = startOfMonth().toISOString();
  const monthEnd = endOfMonth().toISOString();

  const [places, tx] = await Promise.all([
    supabase.from("places").select("*").order("name"),
    supabase
      .from("transactions")
      .select("place_id,amount,type,occurred_at")
      .eq("type", "despesa")
      .eq("status", "pago")
      .eq("excluded_from_stats", false)
      .gte("occurred_at", monthStart)
      .lte("occurred_at", monthEnd),
  ]);

  const placesList = (places.data ?? []) as Place[];
  const spendMap = new Map<string, number>();
  for (const t of tx.data ?? []) {
    if (!t.place_id) continue;
    spendMap.set(
      t.place_id,
      (spendMap.get(t.place_id) ?? 0) + Number(t.amount),
    );
  }

  const rankedIds = [...spendMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Locais</h2>
          <p className="text-sm text-muted-foreground">
            Estabelecimentos onde você gasta. Valores referentes ao mês atual.
          </p>
        </div>
        <PlaceDialog />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {placesList.length === 0 ? (
          <Card className="col-span-full border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum local cadastrado.
            </CardContent>
          </Card>
        ) : (
          placesList.map((p) => {
            const spent = spendMap.get(p.id) ?? 0;
            const rank = rankedIds.indexOf(p.id);
            const isTop = rank !== -1;

            return (
              <Card
                key={p.id}
                className="border-border/60 transition-colors hover:border-border"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <MapPin className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {isTop ? `Top ${rank + 1} do mês` : "Este mês"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-muted-foreground">
                      Gasto no mês
                    </div>
                    <div className="text-lg font-semibold tabular-nums text-danger">
                      {formatCurrency(spent)}
                    </div>
                  </div>

                  {p.notes ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {p.notes}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                    <EditPlaceButton place={p} />
                    <DeleteButton
                      confirmText={`Excluir "${p.name}"?`}
                      action={async () => {
                        "use server";
                        return await deletePlace(p.id);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
