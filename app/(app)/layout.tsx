import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");

  const email = user.email ?? "Você";
  const admin = Boolean(isAdmin);

  return (
    <div className="flex min-h-screen bg-background">
      <KeyboardShortcuts />
      <AppSidebar userEmail={email} isAdmin={admin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader userEmail={email} isAdmin={admin} />
        <main className="flex-1 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
