"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Atalhos globais (desktop):
 *  N         → nova transação
 *  G + D     → ir pro Dashboard
 *  G + T     → ir pra Transações
 *  G + R     → ir pra Relatórios
 *  G + C     → ir pra Cartões
 *  G + M     → ir pra Metas
 *  ?         → mostra este toast com os atalhos
 *
 * Não dispara enquanto digitando em input/textarea/contenteditable.
 */
export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let pendingG = false;
    let gTimeout: ReturnType<typeof setTimeout> | null = null;

    const isTypingTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      // sequência G + algo
      if (pendingG) {
        const route: Record<string, string> = {
          d: "/",
          t: "/transacoes",
          r: "/relatorios",
          c: "/cartoes",
          m: "/metas",
          k: "/calendario",
          a: "/contas",
        };
        if (route[key]) {
          e.preventDefault();
          router.push(route[key]);
        }
        pendingG = false;
        if (gTimeout) clearTimeout(gTimeout);
        return;
      }

      switch (key) {
        case "n":
          e.preventDefault();
          router.push("/transacoes/nova");
          break;
        case "g":
          e.preventDefault();
          pendingG = true;
          gTimeout = setTimeout(() => {
            pendingG = false;
          }, 1500);
          break;
        case "?":
          if (e.shiftKey) {
            e.preventDefault();
            toast.message("Atalhos do teclado", {
              description:
                "N = nova transação · G+D dashboard · G+T transações · G+R relatórios · G+C cartões · G+M metas · G+K calendário",
              duration: 8000,
            });
          }
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [router]);

  return null;
}
