import { SidebarContent } from "./sidebar-nav";

interface AppSidebarProps {
  userEmail: string;
  isAdmin?: boolean;
}

export function AppSidebar({ userEmail, isAdmin = false }: AppSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
      <SidebarContent userEmail={userEmail} isAdmin={isAdmin} />
    </aside>
  );
}
