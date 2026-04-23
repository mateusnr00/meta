"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, ShieldPlus, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { promoteUser, demoteUser } from "./actions";

export function AdminRowMenu({
  userId,
  userEmail,
  isAdmin,
}: {
  userId: string;
  userEmail: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={pending}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {isAdmin ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (!confirm(`Remover admin de ${userEmail}?`)) return;
              start(async () => {
                const res = await demoteUser(userId);
                if (res?.error) toast.error(res.error);
                else {
                  toast.success("Admin removido");
                  router.refresh();
                }
              });
            }}
          >
            <ShieldOff className="mr-2 size-4" />
            Remover admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              if (!confirm(`Promover ${userEmail} a admin?`)) return;
              start(async () => {
                const res = await promoteUser(userId);
                if (res?.error) toast.error(res.error);
                else {
                  toast.success("Usuário promovido a admin");
                  router.refresh();
                }
              });
            }}
          >
            <ShieldPlus className="mr-2 size-4" />
            Promover a admin
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
