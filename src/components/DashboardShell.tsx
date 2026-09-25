import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { DailySalesDialog } from "./DailySalesDialog";

export function DashboardShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("milanhub-sidebar-collapsed") === "true";
  });

  const toggleSidebar = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("milanhub-sidebar-collapsed", String(next));
      document.documentElement.dataset.sidebarCollapsed = String(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground md:hidden"
              >
                {collapsed ? <Menu className="size-5" /> : <X className="size-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold lg:text-[28px]">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {action}
              <DailySalesDialog />
            </div>
          </div>
        </header>
        <main className="grid-noise px-6 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
