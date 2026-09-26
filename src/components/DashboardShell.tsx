import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setCollapsed(true);
      document.documentElement.dataset.sidebarCollapsed = "true";
    }
  }, []);

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
      {!collapsed && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={toggleSidebar}
          className="fixed inset-0 z-10 bg-black/35 md:hidden"
        />
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground md:hidden"
              >
                {collapsed ? <Menu className="size-5" /> : <X className="size-5" />}
              </button>
              <div>
                <h1 className="truncate text-xl font-bold sm:text-2xl lg:text-[28px]">{title}</h1>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
              {action}
              <DailySalesDialog />
            </div>
          </div>
        </header>
        <main className="grid-noise min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
