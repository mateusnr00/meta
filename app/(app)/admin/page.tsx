import { redirect } from "next/navigation";
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Shield,
  ArrowRightLeft,
  UserPlus,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/kpi-card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { AdminRowMenu } from "./admin-row-menu";

export const dynamic = "force-dynamic";

interface AdminOverview {
  total_users: number;
  active_7d: number;
  active_30d: number;
  new_users_30d: number;
  total_transactions: number;
  total_receitas: number;
  total_despesas: number;
  total_accounts: number;
  total_admins: number;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  is_admin: boolean;
  accounts_count: number;
  transactions_count: number;
  total_receitas: number;
  total_despesas: number;
  last_transaction_at: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} meses`;
  return `há ${Math.floor(months / 12)}a`;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // Gate — RLS garante que RPC falhe se não admin, mas também checamos aqui
  // para dar um redirect limpo em vez de crash
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const [overviewRes, usersRes] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_list_users"),
  ]);

  const overview = (overviewRes.data ?? {
    total_users: 0,
    active_7d: 0,
    active_30d: 0,
    new_users_30d: 0,
    total_transactions: 0,
    total_receitas: 0,
    total_despesas: 0,
    total_accounts: 0,
    total_admins: 0,
  }) as AdminOverview;

  const users = (usersRes.data ?? []) as AdminUser[];
  const volume = Number(overview.total_receitas) + Number(overview.total_despesas);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-[10px]">
              <Shield className="size-3" /> Painel do dono
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Visão geral do sistema
          </h2>
          <p className="text-sm text-muted-foreground">
            Apenas admins conseguem acessar esta página.
          </p>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total de usuários"
          value={overview.total_users}
          format="number"
          icon={Users}
          variant="info"
          sublabel={`${overview.total_admins} admin${overview.total_admins === 1 ? "" : "s"}`}
        />
        <KpiCard
          label="Ativos (30 dias)"
          value={overview.active_30d}
          format="number"
          icon={Activity}
          variant="success"
          sublabel={`${overview.active_7d} nos últimos 7 dias`}
        />
        <KpiCard
          label="Novos usuários"
          value={overview.new_users_30d}
          format="number"
          icon={UserPlus}
          variant="default"
          sublabel="últimos 30 dias"
        />
        <KpiCard
          label="Transações totais"
          value={overview.total_transactions}
          format="number"
          icon={ArrowRightLeft}
          variant="default"
          sublabel={`em ${overview.total_accounts} contas`}
        />
      </div>

      {/* Volume movimentado */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="border-border/60 gradient-success">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total de receitas
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-success">
                {formatCurrency(Number(overview.total_receitas))}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 gradient-danger">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total de despesas
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-danger">
                {formatCurrency(Number(overview.total_despesas))}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-danger/15 text-danger">
              <TrendingDown className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 gradient-info">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Volume total
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {formatCurrency(volume)}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-info/15 text-info">
              <Wallet className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de usuários */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Usuários</CardTitle>
          <CardDescription>
            Todas as contas cadastradas no sistema com estatísticas de uso.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum usuário ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead className="text-right">Contas</TableHead>
                  <TableHead className="text-right">Trans.</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead>Última atividade</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary ring-1 ring-primary/30">
                          {u.email.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">
                              {u.email}
                            </span>
                            {u.is_admin ? (
                              <Badge
                                variant="outline"
                                className="gap-1 border-primary/40 px-1.5 py-0 text-[9px] text-primary"
                              >
                                <Shield className="size-2.5" />
                                Admin
                              </Badge>
                            ) : null}
                            {!u.email_confirmed ? (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[9px]"
                              >
                                não confirmado
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(u.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {u.last_sign_in_at ? (
                        <span title={formatDateTime(u.last_sign_in_at)}>
                          {timeAgo(u.last_sign_in_at)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {u.accounts_count}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {u.transactions_count}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-success">
                      {formatCurrency(Number(u.total_receitas))}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-danger">
                      {formatCurrency(Number(u.total_despesas))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {u.last_transaction_at
                        ? timeAgo(u.last_transaction_at)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <AdminRowMenu
                        userId={u.id}
                        userEmail={u.email}
                        isAdmin={u.is_admin}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
