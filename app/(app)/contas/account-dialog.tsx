"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/color-picker";
import type { Account, AccountType } from "@/types/database";
import { createAccount, updateAccount } from "./actions";

export function AccountDialog({
  account,
  trigger,
}: {
  account?: Account;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [type, setType] = useState<AccountType>(account?.type ?? "corrente");
  const isEdit = Boolean(account);

  async function onSubmit(fd: FormData) {
    fd.set("type", type);
    start(async () => {
      const res = isEdit
        ? await updateAccount(account!.id, fd)
        : await createAccount(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isEdit ? "Conta atualizada!" : "Conta criada!");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nova conta
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            Uma conta representa onde seu dinheiro está.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="acc-name">Nome *</Label>
            <Input
              id="acc-name"
              name="name"
              defaultValue={account?.name}
              placeholder="Ex: Conta Nubank"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="carteira">Carteira</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="credito">Cartão de crédito</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="acc-balance">Saldo inicial</Label>
              <Input
                id="acc-balance"
                name="initial_balance"
                type="number"
                step="0.01"
                defaultValue={account?.initial_balance ?? 0}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Cor</Label>
            <ColorPicker name="color" defaultValue={account?.color ?? "#3b82f6"} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditAccountButton({ account }: { account: Account }) {
  return (
    <AccountDialog
      account={account}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      }
    />
  );
}
