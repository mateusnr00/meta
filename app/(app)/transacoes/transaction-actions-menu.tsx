"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteTransaction,
  duplicateTransaction,
  toggleExcludedFromStats,
} from "./actions";

export function TransactionActionsMenu({
  id,
  excluded,
}: {
  id: string;
  excluded?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" disabled={pending}>
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/transacoes/${id}`} />}>
          <Pencil className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            start(async () => {
              const res = await duplicateTransaction(id);
              if (res?.error) toast.error(res.error);
              else {
                toast.success("Transação duplicada!");
                router.refresh();
              }
            });
          }}
        >
          <Copy className="mr-2 size-4" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            start(async () => {
              const res = await toggleExcludedFromStats(id);
              if (res?.error) toast.error(res.error);
              else {
                toast.success(
                  res.excluded
                    ? "Tirado das análises e do saldo"
                    : "Voltou para as análises e saldo",
                );
                router.refresh();
              }
            });
          }}
        >
          {excluded ? (
            <>
              <Eye className="mr-2 size-4" />
              Incluir nas análises
            </>
          ) : (
            <>
              <EyeOff className="mr-2 size-4" />
              Tirar das análises
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (!confirm("Excluir esta transação?")) return;
            start(async () => {
              const res = await deleteTransaction(id);
              if (res?.error) toast.error(res.error);
              else {
                toast.success("Excluída");
                router.refresh();
              }
            });
          }}
        >
          <Trash2 className="mr-2 size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
