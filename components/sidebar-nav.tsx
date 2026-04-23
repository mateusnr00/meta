"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Tag,
  Wallet,
  MapPin,
  BarChart3,
  CalendarDays,
  CreditCard,
  Target,
  Settings,
  LogOut,
  Plus,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/app/login/actions";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { title: string; items: NavItem[] };

function buildNavSections(isAdmin: boolean): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "Principal",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/transacoes", label: "Transações", icon: ArrowRightLeft },
        { href: "/calendario", label: "Calendário", icon: CalendarDays },
        { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      ],
    },
    {
      title: "Cadastros",
      items: [
        { href: "/contas", label: "Contas", icon: Wallet },
        { href: "/categorias", label: "Categorias", icon: Tag },
        { href: "/locais", label: "Locais", icon: MapPin },
        { href: "/cartoes", label: "Cartões", icon: CreditCard },
      ],
    },
    {
      title: "Planejamento",
      items: [
        { href: "/metas", label: "Metas & Orçamentos", icon: Target },
        { href: "/configuracoes", label: "Configurações", icon: Settings },
      ],
    },
  ];
  if (isAdmin) {
    sections.push({
      title: "Dono",
      items: [{ href: "/admin", label: "Admin", icon: Shield }],
    });
  }
  return sections;
}

export function SidebarContent({
  userEmail,
  isAdmin = false,
  onNavigate,
}: {
  userEmail: string;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navSections = buildNavSections(isAdmin);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
          <span className="text-sm font-bold text-primary">M</span>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Meta</div>
          <div className="text-[11px] text-sidebar-foreground/60">
            Finanças pessoais
          </div>
        </div>
      </div>

      <div className="px-4 pb-2">
        <Link
          href="/transacoes/nova"
          onClick={onNavigate}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full justify-start gap-2",
          )}
        >
          <Plus className="size-4" />
          Nova transação
        </Link>
      </div>

      <Separator className="my-2 bg-sidebar-border" />

      <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active
                            ? "text-primary"
                            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary ring-1 ring-primary/40">
            {userEmail.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 text-xs text-sidebar-foreground/80">
            <div className="truncate font-medium">{userEmail}</div>
            <div className="text-sidebar-foreground/50">
              {isAdmin ? "Admin" : "Conta pessoal"}
            </div>
          </div>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="size-8 text-sidebar-foreground/70 hover:text-destructive"
            title="Sair"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
