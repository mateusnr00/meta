"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/transacoes": "Transações",
  "/transacoes/nova": "Nova transação",
  "/calendario": "Calendário financeiro",
  "/relatorios": "Relatórios",
  "/contas": "Contas",
  "/categorias": "Categorias",
  "/locais": "Locais",
  "/cartoes": "Cartões de crédito",
  "/metas": "Metas & Orçamentos",
  "/configuracoes": "Configurações",
};

export function AppHeader() {
  const pathname = usePathname();
  const title =
    titleMap[pathname] ??
    Object.keys(titleMap)
      .filter((k) => k !== "/" && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0]
      ? titleMap[
          Object.keys(titleMap)
            .filter((k) => k !== "/" && pathname.startsWith(k))
            .sort((a, b) => b.length - a.length)[0]
        ]
      : "Meta";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/transacoes/nova"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova transação</span>
        </Link>
      </div>
    </header>
  );
}
