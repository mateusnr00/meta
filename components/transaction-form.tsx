"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toDatetimeLocal } from "@/lib/format";
import type {
  Account,
  Category,
  CreditCard,
  Place,
  Transaction,
  TransactionType,
  Essentiality,
  TransactionStatus,
} from "@/types/database";
import {
  createTransaction,
  updateTransaction,
} from "@/app/(app)/transacoes/actions";

interface Props {
  mode: "create" | "edit";
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
  places: Place[];
  creditCards?: CreditCard[];
}

export function TransactionForm({
  mode,
  transaction,
  categories,
  accounts,
  places,
  creditCards = [],
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "despesa",
  );
  const [status, setStatus] = useState<TransactionStatus>(
    transaction?.status ?? "pago",
  );
  const [essentiality, setEssentiality] = useState<Essentiality>(
    transaction?.essentiality ?? "neutro",
  );
  const [categoryId, setCategoryId] = useState<string>(
    transaction?.category_id ?? "none",
  );
  const [subcategoryId, setSubcategoryId] = useState<string>(
    transaction?.subcategory_id ?? "none",
  );
  const [placeId, setPlaceId] = useState<string>(
    transaction?.place_id ?? "none",
  );
  const [accountId, setAccountId] = useState<string>(
    transaction?.account_id ?? (accounts[0]?.id ?? "none"),
  );
  const [destAccountId, setDestAccountId] = useState<string>(
    transaction?.destination_account_id ?? "none",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    () => {
      const v = (transaction?.payment_method ?? "").toLowerCase();
      if (v.includes("pix")) return "Pix";
      if (v.includes("cr")) return "Crédito";
      return "";
    },
  );
  const [creditCardId, setCreditCardId] = useState<string>(
    transaction?.credit_card_id ??
      (creditCards.length === 1 ? creditCards[0].id : "none"),
  );

  const rootCategories = categories.filter(
    (c) => !c.parent_id && c.type === type,
  );
  const subcategories = categories.filter(
    (c) => c.parent_id === categoryId && categoryId !== "none",
  );

  async function onSubmit(formData: FormData) {
    formData.set("type", type);
    formData.set("status", status);
    formData.set("essentiality", essentiality);
    formData.set(
      "category_id",
      categoryId && categoryId !== "none" ? categoryId : "",
    );
    formData.set(
      "subcategory_id",
      subcategoryId && subcategoryId !== "none" ? subcategoryId : "",
    );
    formData.set("place_id", placeId && placeId !== "none" ? placeId : "");
    formData.set(
      "account_id",
      accountId && accountId !== "none" ? accountId : "",
    );
    formData.set(
      "destination_account_id",
      destAccountId && destAccountId !== "none" ? destAccountId : "",
    );
    // Cartão só é enviado se pagamento = Crédito e tipo = despesa
    const useCard =
      paymentMethod === "Crédito" &&
      type === "despesa" &&
      creditCardId !== "none";
    formData.set("credit_card_id", useCard ? creditCardId : "");

    start(async () => {
      const action =
        mode === "create"
          ? createTransaction
          : (fd: FormData) => updateTransaction(transaction!.id, fd);
      const res = await action(formData);
      if (res?.error) toast.error(res.error);
      else toast.success(mode === "create" ? "Transação criada!" : "Atualizada!");
    });
  }

  const defaultDateTime = transaction
    ? toDatetimeLocal(new Date(transaction.occurred_at))
    : toDatetimeLocal(new Date());

  const typeOptions: {
    value: TransactionType;
    label: string;
    color: string;
  }[] = [
    { value: "despesa", label: "Despesa", color: "var(--danger)" },
    { value: "receita", label: "Receita", color: "var(--success)" },
    { value: "transferencia", label: "Transferência", color: "var(--info)" },
  ];

  return (
    <form action={onSubmit} className="grid gap-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Button>
      </div>

      {/* Tipo */}
      <div className="grid grid-cols-3 gap-2">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium transition-all",
              type === opt.value
                ? "border-transparent bg-card shadow-lg ring-2"
                : "border-border/60 bg-card/30 hover:border-border hover:bg-card/60",
            )}
            style={
              type === opt.value
                ? { boxShadow: `0 0 0 2px ${opt.color}` }
                : undefined
            }
          >
            <span
              className="mr-2 inline-block size-2 rounded-full"
              style={{ backgroundColor: opt.color }}
            />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Principal */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Informações principais</CardTitle>
            <CardDescription>Descrição, valor e data.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                name="description"
                defaultValue={transaction?.description ?? ""}
                placeholder="Ex: Almoço no restaurante X"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={transaction?.amount ?? ""}
                  placeholder="0,00"
                  required
                  inputMode="decimal"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="occurred_at">Data e hora *</Label>
                <Input
                  id="occurred_at"
                  name="occurred_at"
                  type="datetime-local"
                  defaultValue={defaultDateTime}
                  required
                />
              </div>
            </div>

            {type !== "transferencia" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "none")}>
                    <SelectTrigger>
                      <SelectValue>
                        {(v: string | null) => {
                          if (!v || v === "none") return "— nenhuma —";
                          const c = rootCategories.find((x) => x.id === v);
                          return c ? (
                            <span className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.name}
                            </span>
                          ) : (
                            "Selecione"
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— nenhuma —</SelectItem>
                      {rootCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Subcategoria</Label>
                  <Select
                    value={subcategoryId}
                    onValueChange={(v) => setSubcategoryId(v ?? "none")}
                    disabled={subcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {(v: string | null) => {
                          if (!v || v === "none")
                            return subcategories.length === 0
                              ? "Nenhuma disponível"
                              : "— nenhuma —";
                          return (
                            subcategories.find((x) => x.id === v)?.name ??
                            "Selecione"
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— nenhuma —</SelectItem>
                      {subcategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {type !== "transferencia" && (
              <div className="grid gap-1.5">
                <Label>Local / estabelecimento</Label>
                <Select value={placeId} onValueChange={(v) => setPlaceId(v ?? "none")}>
                  <SelectTrigger>
                    <SelectValue>
                      {(v: string | null) => {
                        if (!v || v === "none") return "— não informar —";
                        return places.find((x) => x.id === v)?.name ?? "Selecione";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— não informar —</SelectItem>
                    {places.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contas e extras */}
        <div className="grid gap-4">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Contas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>
                  {type === "transferencia" ? "Conta de origem *" : "Conta"}
                </Label>
                <Select value={accountId} onValueChange={(v) => setAccountId(v ?? "none")}>
                  <SelectTrigger>
                    <SelectValue>
                      {(v: string | null) => {
                        if (!v || v === "none") return "— não informar —";
                        const a = accounts.find((x) => x.id === v);
                        return a ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: a.color }}
                            />
                            {a.name}
                          </span>
                        ) : (
                          "Selecione"
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— não informar —</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: a.color }}
                          />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === "transferencia" && (
                <div className="grid gap-1.5">
                  <Label>Conta de destino *</Label>
                  <Select
                    value={destAccountId}
                    onValueChange={(v) => setDestAccountId(v ?? "none")}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {(v: string | null) => {
                          if (!v || v === "none") return "— selecionar —";
                          return (
                            accounts.find((x) => x.id === v)?.name ?? "Selecione"
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— selecionar —</SelectItem>
                      {accounts
                        .filter((a) => a.id !== accountId)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label>Forma de pagamento</Label>
                <input type="hidden" name="payment_method" value={paymentMethod} />
                <div className="grid grid-cols-2 gap-2">
                  {(["Pix", "Crédito"] as const).map((opt) => {
                    const active = paymentMethod === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setPaymentMethod(active ? "" : opt)
                        }
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                          active
                            ? "border-primary/60 bg-primary/15 text-primary ring-1 ring-primary/40"
                            : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:bg-card/60 hover:text-foreground",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === "Crédito" && type === "despesa" ? (
                <div className="grid gap-1.5">
                  <Label>Cartão</Label>
                  {creditCards.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      Você ainda não tem cartões cadastrados.{" "}
                      <Link
                        href="/cartoes"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Cadastrar cartão
                      </Link>
                    </div>
                  ) : (
                    <Select
                      value={creditCardId}
                      onValueChange={(v) => setCreditCardId(v ?? "none")}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {(v: string | null) => {
                            if (!v || v === "none") return "Selecione um cartão";
                            const c = creditCards.find((x) => x.id === v);
                            return c ? (
                              <span className="flex items-center gap-2">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                {c.name}
                              </span>
                            ) : (
                              "Selecione"
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— não informar —</SelectItem>
                        {creditCards.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Extras</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as TransactionStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === "despesa" && (
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
              )}

              {mode === "create" && type !== "transferencia" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="installment_total">
                    Parcelas (opcional)
                  </Label>
                  <Input
                    id="installment_total"
                    name="installment_total"
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Ex: 12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cria uma transação para cada parcela.
                  </p>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={transaction?.tags?.join(", ") ?? ""}
                  placeholder="trabalho, viagem, urgente"
                />
                <p className="text-xs text-muted-foreground">
                  Separadas por vírgula.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            defaultValue={transaction?.notes ?? ""}
            placeholder="Notas adicionais…"
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/transacoes"
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : mode === "create" ? (
            "Salvar transação"
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </div>
    </form>
  );
}
