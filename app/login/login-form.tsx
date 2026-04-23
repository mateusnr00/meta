"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { login, signup } from "./actions";

export function LoginForm() {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handle(formData: FormData) {
    start(async () => {
      const action = mode === "login" ? login : signup;
      const result = await action(formData);
      if (result && "error" in result && result.error) toast.error(result.error);
      else if (result && "success" in result && result.success)
        toast.success(result.success);
    });
  }

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Acessar conta</CardTitle>
        <CardDescription>
          Entre ou crie uma conta para começar a controlar suas finanças.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "login" | "signup")}
          className="w-full"
        >
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="m-0">
            <form action={handle} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email-in">Email</Label>
                <Input
                  id="email-in"
                  name="email"
                  type="email"
                  placeholder="voce@email.com"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password-in">Senha</Label>
                <Input
                  id="password-in"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="m-0">
            <form action={handle} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email-up">Email</Label>
                <Input
                  id="email-up"
                  name="email"
                  type="email"
                  placeholder="voce@email.com"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password-up">Senha</Label>
                <Input
                  id="password-up"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Criar conta"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
