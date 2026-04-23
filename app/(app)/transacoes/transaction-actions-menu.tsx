"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Copy, Pencil, Trash2 } from "lucide-react";
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
} from "./actions";

export function TransactionActionsMenu({ id }: { id: string }) {
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
