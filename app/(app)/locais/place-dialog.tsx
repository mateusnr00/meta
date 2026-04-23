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
import { Textarea } from "@/components/ui/textarea";
import type { Place } from "@/types/database";
import { createPlace, updatePlace } from "./actions";

export function PlaceDialog({
  place,
  trigger,
}: {
  place?: Place;
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const isEdit = Boolean(place);

  async function onSubmit(fd: FormData) {
    start(async () => {
      const res = isEdit
        ? await updatePlace(place!.id, fd)
        : await createPlace(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isEdit ? "Local atualizado!" : "Local criado!");
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
              Novo local
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar local" : "Novo local"}</DialogTitle>
          <DialogDescription>
            Estabelecimentos, apps ou lugares onde você gasta.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="p-name">Nome *</Label>
            <Input
              id="p-name"
              name="name"
              defaultValue={place?.name}
              placeholder="Ex: iFood"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-notes">Observações</Label>
            <Textarea
              id="p-notes"
              name="notes"
              defaultValue={place?.notes ?? ""}
              rows={3}
            />
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

export function EditPlaceButton({ place }: { place: Place }) {
  return (
    <PlaceDialog
      place={place}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      }
    />
  );
}
