import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Wrench,
  FileBarChart,
  Wallet,
  Bell,
  History,
  Hexagon,
  PanelLeftClose,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { clearCurrentUser, getCurrentUser } from "@/lib/auth";

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

export function AppSidebar({ onClose }: { onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const email = user?.email ?? "Guest";
  const initials = email === "Guest" ? "G" : email.slice(0, 2).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-screen w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0">
      <div className="flex items-center gap-3 px-4 py-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary glow-ring">
          <Hexagon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold tracking-tight">Milan Hub</p>
          <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Stock Control
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav
          .filter(({ to }) => to !== "/revenue" || user?.role === "admin")
          .map(({ label, icon: Icon, to }) => {
            const active = pathname === to;
            return (
              <Link
                key={label}
                to={to}
                title={label}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/12 text-primary glow-ring"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-2/70 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{email}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {user?.role ?? "Guest"}
            </span>
          </div>
        </div>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <span>Theme</span>
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>

        <button
          onClick={() => {
            clearCurrentUser();
            navigate({ to: "/login" });
          }}
          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/12 hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
