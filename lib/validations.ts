import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["receita", "despesa", "transferencia"]),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  description: z.string().min(1, "Informe uma descrição").max(200),
  category_id: z.string().uuid().nullable().optional(),
  subcategory_id: z.string().uuid().nullable().optional(),
  place_id: z.string().uuid().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  destination_account_id: z.string().uuid().nullable().optional(),
  credit_card_id: z.string().uuid().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  status: z.enum(["pago", "pendente", "cancelado"]).default("pago"),
  essentiality: z.enum(["essencial", "superfluo", "neutro"]).default("neutro"),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  occurred_at: z.string().min(1),
  installment_total: z.coerce.number().int().min(1).max(120).nullable().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Informe o nome").max(80),
  type: z.enum(["receita", "despesa", "transferencia"]).default("despesa"),
  parent_id: z.string().uuid().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#64748b"),
  essentiality: z.enum(["essencial", "superfluo", "neutro"]).default("neutro"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const accountSchema = z.object({
  name: z.string().min(1, "Informe o nome").max(80),
  type: z
    .enum(["corrente", "poupanca", "carteira", "investimento", "credito", "outro"])
    .default("corrente"),
  initial_balance: z.coerce.number().default(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#64748b"),
});

export type AccountInput = z.infer<typeof accountSchema>;

export const placeSchema = z.object({
  name: z.string().min(1, "Informe o nome").max(120),
  notes: z.string().max(500).nullable().optional(),
});

export type PlaceInput = z.infer<typeof placeSchema>;

export const budgetSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const creditCardSchema = z.object({
  name: z.string().min(1, "Informe o nome").max(80),
  brand: z.string().max(40).nullable().optional(),
  credit_limit: z.coerce.number().min(0).default(0),
  closing_day: z.coerce.number().int().min(1).max(31).default(1),
  due_day: z.coerce.number().int().min(1).max(31).default(10),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#6366f1"),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;

export const goalSchema = z.object({
  name: z.string().min(1, "Informe o nome").max(80),
  target_amount: z.coerce.number().positive("Informe o valor alvo"),
  current_amount: z.coerce.number().min(0).default(0),
  target_date: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#10b981"),
});

export type GoalInput = z.infer<typeof goalSchema>;
