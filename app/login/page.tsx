import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/12%),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,theme(colors.chart-3/10%),transparent_50%)]"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <span className="text-lg font-semibold text-primary">M</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Meta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clareza total sobre sua vida financeira.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Uso pessoal. Seus dados ficam protegidos no seu Supabase.
        </p>
      </div>
    </div>
  );
}
