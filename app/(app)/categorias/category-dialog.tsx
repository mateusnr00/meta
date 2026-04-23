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
import type { Category, Essentiality, TransactionType } from "@/types/database";
import { createCategory, updateCategory } from "./actions";

interface Props {
  category?: Category;
  parents: Category[];
  trigger?: React.ReactElement;
}

export function CategoryDialog({ category, parents, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [type, setType] = useState<TransactionType>(category?.type ?? "despesa");
  const [essentiality, setEssentiality] = useState<Essentiality>(
    category?.essentiality ?? "neutro",
  );
  const [parentId, setParentId] = useState<string>(
    category?.parent_id ?? "none",
  );

  const isEdit = Boolean(category);

  async function onSubmit(fd: FormData) {
    fd.set("type", type);
    fd.set("essentiality", essentiality);
    fd.set("parent_id", parentId === "none" ? "" : parentId);
    start(async () => {
      const res = isEdit
        ? await updateCategory(category!.id, fd)
        : await createCategory(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(isEdit ? "Categoria atualizada!" : "Categoria criada!");
        setOpen(false);
        router.refresh();
      }
    });
  }

  const possibleParents = parents.filter(
    (p) => p.type === type && !p.parent_id && p.id !== category?.id,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nova categoria
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            Organize seus gastos e receitas por tema.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cat-name">Nome *</Label>
            <Input
              id="cat-name"
              name="name"
              defaultValue={category?.name}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Essencialidade</Label>
              <Select
                value={essentiality}
                onValueChange={(v) => setEssentiality(v as Essentiality)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="superfluo">Supérfluo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Categoria pai (opcional)</Label>
            <Select value={parentId} onValueChange={(v) => setParentId(v ?? "none")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— categoria raiz —</SelectItem>
                {possibleParents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Cor</Label>
            <ColorPicker name="color" defaultValue={category?.color ?? "#64748b"} />
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

export function EditCategoryButton({
  category,
  parents,
}: {
  category: Category;
  parents: Category[];
}) {
  return (
    <CategoryDialog
      category={category}
      parents={parents}
      trigger={
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      }
    />
  );
}
