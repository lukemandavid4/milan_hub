import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Wrench,
  FileBarChart,
  Wallet,
  Bell,
  History,
  Hexagon,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: "/" | "/products" | "/services" | "/report" | "/revenue" | "/notifications" | "/history";
};

const nav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Products", icon: Package, to: "/products" },
  { label: "Services", icon: Wrench, to: "/services" },
  { label: "Report", icon: FileBarChart, to: "/report" },
  { label: "Revenue", icon: Wallet, to: "/revenue" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "History", icon: History, to: "/history" },
];

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email] = useState(() => {
    if (typeof window === "undefined") return "milan@milanhub.io";
    return window.localStorage.getItem("milanhub-user-email") || "milan@milanhub.io";
  });
  const initials = email
    .split(/[.@\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside
      data-sidebar
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      <div className={cn("flex items-center px-4 py-5", collapsed ? "justify-center" : "gap-3")}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary glow-ring">
          <Hexagon className="size-5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold tracking-tight">Milan Hub</p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Stock Control
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="ml-auto grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1 overflow-y-auto py-2", collapsed ? "px-2" : "px-3")}>
        {nav.map(({ label, icon: Icon, to }) => {
          const active = pathname === to;
          return (
            <Link
              key={label}
              to={to}
              title={label}
              className={cn(
                "group flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-primary/12 text-primary glow-ring"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-xl bg-surface-2/70 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{email}</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Admin
              </span>
            </div>
          </div>
        )}

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className={cn(
            "mt-2 flex w-full items-center rounded-xl py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed ? "justify-center px-0" : "justify-between px-3",
          )}
        >
          {!collapsed && <span>Theme</span>}
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>

        <button
          onClick={() => navigate({ to: "/login" })}
          className={cn(
            "mt-1 flex w-full items-center gap-2 rounded-xl py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/12 hover:text-destructive",
            collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
        {collapsed && (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="mt-3 flex w-full items-center justify-center border-t border-sidebar-border pt-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="size-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
