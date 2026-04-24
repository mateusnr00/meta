export type TransactionType = "receita" | "despesa" | "transferencia";
export type TransactionStatus = "pago" | "pendente" | "cancelado";
export type AccountType =
  | "corrente"
  | "poupanca"
  | "carteira"
  | "investimento"
  | "credito"
  | "outro";
export type Essentiality = "essencial" | "superfluo" | "neutro";
export type RecurrenceFrequency =
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "anual";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
  icon: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  account_id: string;
  user_id: string;
  name: string;
  color: string;
  type: AccountType;
  initial_balance: number;
  balance: number;
}

export interface Category {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  essentiality: Essentiality;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  subcategory_id: string | null;
  place_id: string | null;
  account_id: string | null;
  destination_account_id: string | null;
  credit_card_id: string | null;
  payment_method: string | null;
  status: TransactionStatus;
  essentiality: Essentiality;
  tags: string[] | null;
  notes: string | null;
  occurred_at: string;
  installment_number: number | null;
  installment_total: number | null;
  installment_group_id: string | null;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithRelations extends Transaction {
  category?: Pick<Category, "id" | "name" | "color" | "essentiality"> | null;
  subcategory?: Pick<Category, "id" | "name" | "color"> | null;
  place?: Pick<Place, "id" | "name"> | null;
  account?: Pick<Account, "id" | "name" | "color"> | null;
  destination_account?: Pick<Account, "id" | "name" | "color"> | null;
  credit_card?: Pick<CreditCard, "id" | "name" | "color"> | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
