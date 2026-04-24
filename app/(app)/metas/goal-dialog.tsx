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
import type { Goal } from "@/types/database";
import { createGoal, updateGoal } from "./actions";

export function GoalDialog({
  goal,
  trigger,
}: {
  goal?: Goal;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const isEdit = Boolean(goal);

  async function onSubmit(fd: FormData) {
    start(async () => {
      const res = isEdit
        ? await updateGoal(goal!.id, fd)
        : await createGoal(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isEdit ? "Meta atualizada!" : "Meta criada!");
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
              Nova meta
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>
            Defina um objetivo de economia com prazo opcional.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="g-name">Nome da meta *</Label>
            <Input
              id="g-name"
              name="name"
              defaultValue={goal?.name}
              placeholder="Ex: Reserva de emergência"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="g-target">Valor alvo (R$) *</Label>
              <Input
                id="g-target"
                name="target_amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={goal?.target_amount ?? ""}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="g-current">Valor atual (R$)</Label>
              <Input
                id="g-current"
                name="current_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={goal?.current_amount ?? 0}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="g-date">Data alvo</Label>
            <Input
              id="g-date"
              name="target_date"
              type="date"
              defaultValue={goal?.target_date ?? ""}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Cor</Label>
            <ColorPicker name="color" defaultValue={goal?.color ?? "#10b981"} />
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

export function EditGoalButton({ goal }: { goal: Goal }) {
  return (
    <GoalDialog
      goal={goal}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      }
    />
  );
}
