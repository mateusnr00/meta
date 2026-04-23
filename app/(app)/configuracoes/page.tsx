import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Preferências da sua conta.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4 text-muted-foreground" />
            Conta
          </CardTitle>
          <CardDescription>Dados da sua conta no Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground">ID</span>
            <span className="truncate font-mono text-xs">{user?.id}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Sair</CardTitle>
          <CardDescription>Encerrar sessão neste dispositivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="destructive" className="gap-2">
              <LogOut className="size-4" />
              Sair da conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
