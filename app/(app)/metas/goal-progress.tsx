"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToGoal } from "./actions";

export function GoalQuickAdd({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();

  const submit = (sign: 1 | -1) => {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    start(async () => {
      const res = await addToGoal(goalId, n * sign);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(sign > 0 ? "Depósito registrado!" : "Retirada registrada");
        setValue("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(1);
        }}
        placeholder="Valor"
        className="h-8 text-xs"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-success"
        onClick={() => submit(1)}
        disabled={pending}
        aria-label="Adicionar"
        title="Depositar"
      >
        <Plus className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-danger"
        onClick={() => submit(-1)}
        disabled={pending}
        aria-label="Remover"
        title="Retirar"
      >
        <Minus className="size-4" />
      </Button>
    </div>
  );
}
