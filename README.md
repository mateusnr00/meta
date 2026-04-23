# Meta — Gestão financeira pessoal

Sistema completo de controle financeiro pessoal construído em **Next.js 16 + Supabase + shadcn/ui**.

Visão premium, dark mode nativo, interface em português, foco em clareza e análise profunda da vida financeira.

---

## ✨ O que já está implementado (Fase 1 — MVP)

- **Autenticação** (login / signup) via Supabase.
- **Dashboard** com KPIs (saldo, receitas, despesas, resultado), insights automáticos, gráfico de fluxo diário, top categorias, distribuição por conta, últimas transações e classificação essencial × supérfluo.
- **Transações — CRUD completo**: tipo (receita/despesa/transferência), categoria, subcategoria, local, conta, cartão, status, tags, essencialidade, observações, suporte a **parcelamentos** e **duplicação** de transações.
- **Filtros e busca** de transações (por texto, tipo, categoria, conta).
- **Categorias** com subcategorias, cor customizável e classificação de essencialidade.
- **Contas** com saldo inicial, saldo atual calculado em view SQL e cores por tipo.
- **Locais** com ranking de gastos do mês.
- **Relatórios**: evolução mensal (últimos 6 meses), top categorias, ranking de locais, gastos por dia da semana, média diária, ticket médio, percentual essencial × supérfluo.
- **Calendário financeiro** com visão diária de entradas, saídas e resultado.
- **Configurações** da conta e logout.

### Próximas fases

- **Fase 2** — Cartões de crédito com faturas, Metas e orçamentos por categoria, Recorrências.
- **Fase 3** — Insights automáticos avançados, projeções, importação/exportação, anexos.

---

## 🚀 Como rodar

### 1. Criar projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie um novo projeto.
2. Em **Authentication → Providers → Email**, confirme que **Email** está habilitado. Se quiser pular a confirmação de email em testes, desative a opção "Confirm email".
3. Em **SQL Editor**, abra um novo query, cole todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e execute. Isso cria tabelas, enums, RLS, triggers, view de saldos e função de seed.
4. Em **Project Settings → API**, copie os valores:
   - `Project URL`
   - `anon public key`

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` e cole os valores do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
```

### 3. Instalar e subir

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e crie sua conta na aba **Criar conta**. Ao fazer signup o app dispara a RPC `seed_default_data` que já cria **contas** e **categorias padrão** (alimentação, transporte, salário, etc.) para você começar sem configurar nada.

---

## 🧱 Stack

| Camada          | Tecnologia                                                                 |
| --------------- | -------------------------------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org) (App Router + Turbopack)                  |
| Linguagem       | TypeScript                                                                 |
| Estilo          | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (neutral + dark mode) |
| Formulários     | React Hook Form + Zod                                                      |
| Banco + Auth    | [Supabase](https://supabase.com) (Postgres + Row Level Security)           |
| Gráficos        | [Recharts](https://recharts.org)                                           |
| Ícones          | lucide-react                                                               |
| Notificações    | sonner                                                                     |

---

## 📂 Estrutura

```
app/
├─ (app)/                # Layout autenticado (sidebar + header)
│  ├─ page.tsx           # Dashboard
│  ├─ transacoes/        # CRUD + filtros + parcelamento
│  ├─ categorias/        # Categorias com subcategorias
│  ├─ contas/            # Contas + saldo calculado
│  ├─ locais/            # Estabelecimentos + ranking
│  ├─ relatorios/        # Relatórios analíticos
│  ├─ calendario/        # Visão diária em calendário
│  ├─ cartoes/           # (Fase 2)
│  ├─ metas/             # (Fase 2)
│  └─ configuracoes/
├─ login/                # Rota pública
└─ layout.tsx

components/
├─ ui/                   # shadcn/ui
├─ charts/               # Recharts wrappers
├─ app-sidebar.tsx
├─ app-header.tsx
├─ kpi-card.tsx
├─ transaction-form.tsx
├─ color-picker.tsx
└─ coming-soon.tsx

lib/
├─ supabase/             # client / server / middleware (SSR-aware)
├─ format.ts             # moeda BRL, datas PT-BR, helpers
├─ validations.ts        # schemas Zod
└─ utils.ts              # cn()

supabase/
└─ schema.sql            # schema completo (tabelas, RLS, views, seed RPC)

types/
└─ database.ts           # tipos TS das entidades
```

---

## 🔐 Segurança

Todas as tabelas têm **Row Level Security (RLS)** ligada, com policy `owner_all` que restringe linhas ao `auth.uid() = user_id`. Cada usuário só vê e mexe nos próprios dados.

---

## 🧩 Comandos úteis

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run start    # serve o build
npm run lint     # ESLint
```
