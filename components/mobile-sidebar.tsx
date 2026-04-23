"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-nav";

export function MobileSidebar({
  userEmail,
  isAdmin,
}: {
  userEmail: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent
        side="left"
        className="flex w-72 flex-col border-r border-sidebar-border bg-sidebar p-0"
      >
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <SidebarContent
          userEmail={userEmail}
          isAdmin={isAdmin}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
