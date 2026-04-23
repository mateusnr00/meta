"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/transacoes": "Transações",
  "/transacoes/nova": "Nova transação",
  "/calendario": "Calendário",
  "/relatorios": "Relatórios",
  "/contas": "Contas",
  "/categorias": "Categorias",
  "/locais": "Locais",
  "/cartoes": "Cartões",
  "/metas": "Metas & Orçamentos",
  "/configuracoes": "Configurações",
  "/admin": "Admin",
};

function resolveTitle(pathname: string): string {
  if (titleMap[pathname]) return titleMap[pathname];
  const match = Object.keys(titleMap)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? titleMap[match] : "Meta";
}

export function AppHeader({
  userEmail,
  isAdmin,
}: {
  userEmail: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur lg:h-16 lg:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar userEmail={userEmail} isAdmin={isAdmin} />
        <h1 className="truncate text-base font-semibold tracking-tight lg:text-lg">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/transacoes/nova"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "gap-2",
          )}
          aria-label="Nova transação"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova</span>
        </Link>
      </div>
    </header>
  );
}
