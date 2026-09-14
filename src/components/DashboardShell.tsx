import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
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
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {open && (
        <button
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
      {open && <AppSidebar onClose={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-8">
            <div className="flex items-center gap-3">
              {!open && (
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Open sidebar"
                  className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Menu className="size-5" />
                </button>
              )}
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
