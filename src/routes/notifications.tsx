import { createFileRoute } from "@tanstack/react-router";
import { Bell, CircleAlert, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  getCurrentUser,
  getPendingUsers,
  subscribeToAuthChanges,
  updateUserStatus,
} from "@/lib/auth";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Milan Hub" },
      { name: "description", content: "View stock and system alerts for Milan Hub." },
      { property: "og:title", content: "Notifications — Milan Hub" },
      {
        property: "og:description",
        content: "View Milan Hub stock alerts and important activity.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { products } = useAppState();
  const isAdmin = getCurrentUser()?.role === "admin";
  const [pendingUsers, setPendingUsers] = useState(getPendingUsers);

  useEffect(() => {
    const refresh = () => setPendingUsers(getPendingUsers());
    return subscribeToAuthChanges(refresh);
  }, []);

  function resolveRequest(email: string, status: "approved" | "rejected") {
    updateUserStatus(email, status);
    setPendingUsers(getPendingUsers());
  }

  const alerts = useMemo(() => {
    const items = products
      .filter((product) => product.quantity === 0 || product.quantity <= product.threshold)
      .map((product) => ({
        title: product.quantity === 0 ? "Out of Stock" : "Low Stock",
        detail: `${product.name} is ${product.quantity === 0 ? "out of stock" : `running low (${product.quantity} left)`} in the Milan Hub inventory.`,
        time: new Date(product.updated).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }))
      .sort((a, b) => b.time.localeCompare(a.time));

    return items;
  }, [products]);

  const outOfStockCount = products.filter((product) => product.quantity === 0).length;
  const lowStockCount = products.filter(
    (product) => product.quantity > 0 && product.quantity <= product.threshold,
  ).length;

  return (
    <DashboardShell
      title="Notifications"
      subtitle="Stay updated with your stock alerts and activities"
    >
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-destructive/12 px-3 py-1.5 text-sm font-medium text-destructive">
          <CircleAlert className="size-4" />
          {outOfStockCount} out of stock
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-warning/12 px-3 py-1.5 text-sm font-medium text-warning">
          <Bell className="size-4" />
          {lowStockCount} low stock
        </span>
      </div>

      <section className="panel mt-6 p-5 lg:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
            <ShieldAlert className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Pending Access Requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve or reject new user signup requests
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isAdmin && pendingUsers.length > 0 ? (
            pendingUsers.map((user) => (
              <div
                key={user.email}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface-2/50 p-4"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                  <ShieldAlert className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{user.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Requested {user.role} access on{" "}
                    {new Date(user.requestedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => resolveRequest(user.email, "rejected")}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <UserX className="size-4" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveRequest(user.email, "approved")}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
                  >
                    <UserCheck className="size-4" />
                    Approve
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-border bg-surface-2/50">
              <div className="text-center text-muted-foreground">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-border/50">
                  <ShieldAlert className="size-5" />
                </div>
                <p className="mt-3 text-sm">
                  {isAdmin ? "No pending requests" : "Admin access is required to manage requests"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel mt-6 p-5 lg:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Stock Alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Products that need attention</p>
        </div>

        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <div
                key={`${alert.title}-${alert.detail}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface-2/50 p-4"
              >
                <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-destructive/12 text-destructive">
                  <CircleAlert className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{alert.title}</p>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-10 text-center text-sm text-muted-foreground">
              No active stock alerts. Inventory levels are healthy.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
