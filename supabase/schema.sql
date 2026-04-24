-- ============================================================================
-- Meta — Sistema de Gestão Financeira Pessoal
-- Schema Supabase (Postgres)
-- Execute este SQL no SQL Editor do Supabase antes de rodar o app.
-- ============================================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================
do $$ begin
  create type transaction_type as enum ('receita', 'despesa', 'transferencia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('pago', 'pendente', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_type as enum ('corrente', 'poupanca', 'carteira', 'investimento', 'credito', 'outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type essentiality as enum ('essencial', 'superfluo', 'neutro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurrence_frequency as enum ('diaria', 'semanal', 'quinzenal', 'mensal', 'anual');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Contas (carteira, banco, cartão, etc)
create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type account_type not null default 'corrente',
  initial_balance numeric(14,2) not null default 0,
  color text not null default '#64748b',
  icon text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_user_idx on public.accounts(user_id);

-- Categorias (com subcategorias via parent_id)
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null,
  type transaction_type not null default 'despesa',
  color text not null default '#64748b',
  icon text,
  essentiality essentiality not null default 'neutro',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);
create index if not exists categories_parent_idx on public.categories(parent_id);

-- Locais / estabelecimentos
create table if not exists public.places (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists places_user_idx on public.places(user_id);

-- Cartões de crédito
create table if not exists public.credit_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  credit_limit numeric(14,2) not null default 0,
  closing_day int not null default 1 check (closing_day between 1 and 31),
  due_day int not null default 10 check (due_day between 1 and 31),
  color text not null default '#6366f1',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists credit_cards_user_idx on public.credit_cards(user_id);

-- Transações
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type transaction_type not null,
  amount numeric(14,2) not null check (amount >= 0),
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  destination_account_id uuid references public.accounts(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  payment_method text,
  status transaction_status not null default 'pago',
  essentiality essentiality not null default 'neutro',
  tags text[] default '{}',
  notes text,
  occurred_at timestamptz not null default now(),
  installment_number int,
  installment_total int,
  installment_group_id uuid,
  recurring_id uuid,
  excluded_from_stats boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_not_excluded_idx
  on public.transactions(user_id, occurred_at desc)
  where excluded_from_stats = false;
create index if not exists transactions_occurred_idx on public.transactions(user_id, occurred_at desc);
create index if not exists transactions_category_idx on public.transactions(category_id);
create index if not exists transactions_account_idx on public.transactions(account_id);
create index if not exists transactions_place_idx on public.transactions(place_id);

-- Orçamento por categoria/mês
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);
create index if not exists budgets_user_idx on public.budgets(user_id);

-- Metas de economia/saldo
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  target_date date,
  color text not null default '#10b981',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

-- Transações recorrentes (templates)
create table if not exists public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type transaction_type not null,
  amount numeric(14,2) not null,
  description text not null,
  category_id uuid references public.categories(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  frequency recurrence_frequency not null default 'mensal',
  day_of_month int check (day_of_month between 1 and 31),
  next_run date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recurring_user_idx on public.recurring_transactions(user_id);

-- ============================================================================
-- TRIGGERS (updated_at)
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'accounts','categories','places','credit_cards','transactions',
    'budgets','goals','recurring_transactions'
  ]) loop
    execute format('drop trigger if exists trg_%I_updated on public.%I', t, t);
    execute format('create trigger trg_%I_updated before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.places enable row level security;
alter table public.credit_cards enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.recurring_transactions enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'accounts','categories','places','credit_cards','transactions',
    'budgets','goals','recurring_transactions'
  ]) loop
    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format('create policy "owner_all" on public.%I
                    for all using (auth.uid() = user_id)
                    with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ============================================================================
-- SEED DE CATEGORIAS PADRÃO (executado após signup via RPC)
-- ============================================================================
create or replace function public.seed_default_data(p_user uuid)
returns void language plpgsql security definer as $$
declare
  v_carteira uuid;
begin
  -- Se já tem dados, não re-seed
  if exists (select 1 from public.accounts where user_id = p_user) then
    return;
  end if;

  -- Conta padrão
  insert into public.accounts (user_id, name, type, initial_balance, color)
  values (p_user, 'Carteira', 'carteira', 0, '#10b981')
  returning id into v_carteira;

  insert into public.accounts (user_id, name, type, color) values
    (p_user, 'Conta Corrente', 'corrente', '#3b82f6'),
    (p_user, 'Poupança', 'poupanca', '#8b5cf6');

  -- Categorias de despesa
  insert into public.categories (user_id, name, type, color, essentiality) values
    (p_user, 'Alimentação', 'despesa', '#f97316', 'essencial'),
    (p_user, 'Supermercado', 'despesa', '#f59e0b', 'essencial'),
    (p_user, 'Delivery', 'despesa', '#ef4444', 'superfluo'),
    (p_user, 'Transporte', 'despesa', '#06b6d4', 'essencial'),
    (p_user, 'Combustível', 'despesa', '#0ea5e9', 'essencial'),
    (p_user, 'Moradia', 'despesa', '#8b5cf6', 'essencial'),
    (p_user, 'Contas fixas', 'despesa', '#6366f1', 'essencial'),
    (p_user, 'Saúde', 'despesa', '#ec4899', 'essencial'),
    (p_user, 'Educação', 'despesa', '#14b8a6', 'essencial'),
    (p_user, 'Lazer', 'despesa', '#a855f7', 'superfluo'),
    (p_user, 'Compras', 'despesa', '#d946ef', 'superfluo'),
    (p_user, 'Assinaturas', 'despesa', '#7c3aed', 'neutro'),
    (p_user, 'Viagem', 'despesa', '#22c55e', 'superfluo'),
    (p_user, 'Outros', 'despesa', '#64748b', 'neutro');

  -- Categorias de receita
  insert into public.categories (user_id, name, type, color, essentiality) values
    (p_user, 'Salário', 'receita', '#10b981', 'neutro'),
    (p_user, 'Freelance', 'receita', '#059669', 'neutro'),
    (p_user, 'Investimentos', 'receita', '#0d9488', 'neutro'),
    (p_user, 'Vendas', 'receita', '#16a34a', 'neutro'),
    (p_user, 'Outros recebimentos', 'receita', '#22c55e', 'neutro');
end $$;

-- Garantia: trigger ao criar usuário (opcional, ativar no painel se desejar)
-- Caso não consiga trigger em auth.users, o app chama seed_default_data() no primeiro login.

-- ============================================================================
-- VIEWS AUXILIARES
-- ============================================================================

-- Saldo por conta = reflete o banco real. Ignora transações com credit_card_id
-- (crédito não debita imediatamente). NÃO ignora excluded_from_stats — essas
-- continuam afetando saldo (o dinheiro saiu da conta de verdade), mas ficam
-- fora de KPIs/gráficos/relatórios.
create or replace view public.v_account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.color,
  a.type,
  a.initial_balance
    + coalesce((select sum(amount) from public.transactions t
        where t.account_id = a.id and t.type = 'receita' and t.status = 'pago'
          and t.credit_card_id is null), 0)
    - coalesce((select sum(amount) from public.transactions t
        where t.account_id = a.id and t.type = 'despesa' and t.status = 'pago'
          and t.credit_card_id is null), 0)
    - coalesce((select sum(amount) from public.transactions t
        where t.account_id = a.id and t.type = 'transferencia' and t.status = 'pago'), 0)
    + coalesce((select sum(amount) from public.transactions t
        where t.destination_account_id = a.id and t.type = 'transferencia' and t.status = 'pago'), 0)
    as balance
from public.accounts a
where a.archived = false;

grant select on public.v_account_balances to authenticated;

-- ============================================================================
-- ADMIN DASHBOARD — controle de dono
-- ============================================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

drop policy if exists "admins_can_see" on public.admin_users;
create policy "admins_can_see" on public.admin_users
  for select using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = public as $$
declare v_result json;
begin
  if not public.is_admin() then raise exception 'Forbidden: admin only'; end if;
  select json_build_object(
    'total_users', (select count(*) from auth.users),
    'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'active_30d', (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
    'new_users_30d', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'total_transactions', (select count(*) from public.transactions),
    'total_receitas', (select coalesce(sum(amount), 0) from public.transactions where type = 'receita' and status = 'pago'),
    'total_despesas', (select coalesce(sum(amount), 0) from public.transactions where type = 'despesa' and status = 'pago'),
    'total_accounts', (select count(*) from public.accounts where archived = false),
    'total_admins', (select count(*) from public.admin_users)
  ) into v_result;
  return v_result;
end $$;

create or replace function public.admin_list_users()
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  email_confirmed boolean, is_admin boolean,
  accounts_count int, transactions_count int,
  total_receitas numeric, total_despesas numeric, last_transaction_at timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden: admin only'; end if;
  return query
  select
    u.id, u.email::text, u.created_at, u.last_sign_in_at,
    (u.email_confirmed_at is not null) as email_confirmed,
    exists (select 1 from public.admin_users au where au.user_id = u.id) as is_admin,
    coalesce((select count(*)::int from public.accounts a where a.user_id = u.id and a.archived = false), 0),
    coalesce((select count(*)::int from public.transactions t where t.user_id = u.id), 0),
    coalesce((select sum(t.amount) from public.transactions t where t.user_id = u.id and t.type = 'receita' and t.status = 'pago'), 0),
    coalesce((select sum(t.amount) from public.transactions t where t.user_id = u.id and t.type = 'despesa' and t.status = 'pago'), 0),
    (select max(t.occurred_at) from public.transactions t where t.user_id = u.id)
  from auth.users u
  order by u.created_at desc;
end $$;

create or replace function public.admin_promote(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden: admin only'; end if;
  insert into public.admin_users (user_id) values (p_user_id) on conflict do nothing;
end $$;

create or replace function public.admin_demote(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin_count int;
begin
  if not public.is_admin() then raise exception 'Forbidden: admin only'; end if;
  select count(*) into v_admin_count from public.admin_users;
  if v_admin_count <= 1 then raise exception 'Não é possível remover o último admin'; end if;
  delete from public.admin_users where user_id = p_user_id;
end $$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_promote(uuid) to authenticated;
grant execute on function public.admin_demote(uuid) to authenticated;

-- Para promover um usuário manualmente (execute no SQL Editor):
-- insert into public.admin_users (user_id) select id from auth.users where email = 'seu@email.com';
