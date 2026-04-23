"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account, Category } from "@/types/database";

interface Props {
  categories: Category[];
  accounts: Account[];
}

export function TransactionFilters({ categories, accounts }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`/transacoes?${next.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar descrição..."
          className="pl-9"
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            const timer = setTimeout(() => update("q", v || null), 300);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      <Select
        value={params.get("type") ?? "all"}
        onValueChange={(v) => update("type", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="receita">Receitas</SelectItem>
          <SelectItem value="despesa">Despesas</SelectItem>
          <SelectItem value="transferencia">Transferências</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.get("category") ?? "all"}
        onValueChange={(v) => update("category", v)}
      >
        <SelectTrigger>
          <SelectValue>
            {(v: string | null) => {
              if (!v || v === "all") return "Todas as categorias";
              return categories.find((c) => c.id === v)?.name ?? "Categoria";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("account") ?? "all"}
        onValueChange={(v) => update("account", v)}
      >
        <SelectTrigger>
          <SelectValue>
            {(v: string | null) => {
              if (!v || v === "all") return "Todas as contas";
              return accounts.find((a) => a.id === v)?.name ?? "Conta";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as contas</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
