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
import { ColorPicker } from "@/components/color-picker";
import type { CreditCard } from "@/types/database";
import { createCreditCard, updateCreditCard } from "./actions";

export function CardDialog({
  card,
  trigger,
}: {
  card?: CreditCard;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const isEdit = Boolean(card);

  async function onSubmit(fd: FormData) {
    start(async () => {
      const res = isEdit
        ? await updateCreditCard(card!.id, fd)
        : await createCreditCard(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isEdit ? "Cartão atualizado!" : "Cartão criado!");
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
              Novo cartão
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar cartão" : "Novo cartão de crédito"}
          </DialogTitle>
          <DialogDescription>
            Configure datas de fechamento, vencimento e limite.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cc-name">Apelido do cartão *</Label>
            <Input
              id="cc-name"
              name="name"
              defaultValue={card?.name}
              placeholder="Ex: Nubank"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cc-brand">Bandeira</Label>
              <Input
                id="cc-brand"
                name="brand"
                defaultValue={card?.brand ?? ""}
                placeholder="Visa, Mastercard…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cc-limit">Limite (R$)</Label>
              <Input
                id="cc-limit"
                name="credit_limit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={card?.credit_limit ?? 0}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cc-close">Dia do fechamento</Label>
              <Input
                id="cc-close"
                name="closing_day"
                type="number"
                min="1"
                max="31"
                defaultValue={card?.closing_day ?? 1}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Ex: 20 → fatura fecha dia 20 de cada mês.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cc-due">Dia do vencimento</Label>
              <Input
                id="cc-due"
                name="due_day"
                type="number"
                min="1"
                max="31"
                defaultValue={card?.due_day ?? 10}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Ex: 5 → vence dia 5 do mês seguinte.
              </p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Cor</Label>
            <ColorPicker name="color" defaultValue={card?.color ?? "#6366f1"} />
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

export function EditCardButton({ card }: { card: CreditCard }) {
  return (
    <CardDialog
      card={card}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      }
    />
  );
}
