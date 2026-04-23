"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmText = "Excluir este item?",
}: {
  action: () => Promise<{ error?: string; success?: boolean }>;
  confirmText?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        start(async () => {
          const res = await action();
          if (res?.error) toast.error(res.error);
          else {
            toast.success("Excluído");
            router.refresh();
          }
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
