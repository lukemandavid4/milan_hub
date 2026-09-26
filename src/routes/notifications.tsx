import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  ShieldCheck,
  TriangleAlert,
  XCircle,
  ShoppingBag,
  PackageCheck,
  UserRoundPlus,
  CircleDot,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiRequest } from "@/lib/api";
import { statusOf, type StockStatus } from "@/data/inventory";
import { useAppState } from "@/lib/store";
import { requireSession } from "@/lib/session";

type AccessRequest = { _id: string; email: string; role: string; createdAt: string };
type StoredNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  createdAt: string;
};

const notificationStyle: Record<
  string,
  { icon: typeof Bell; iconStyle: string; badgeStyle: string; label: string }
> = {
  sale: {
    icon: ShoppingBag,
    iconStyle: "bg-primary/12 text-primary",
    badgeStyle: "bg-primary/10 text-primary",
    label: "Sale",
  },
  inventory: {
    icon: PackageCheck,
    iconStyle: "bg-warning/12 text-warning",
    badgeStyle: "bg-warning/10 text-warning",
    label: "Inventory",
  },
  access: {
    icon: UserRoundPlus,
    iconStyle: "bg-accent text-accent-foreground",
    badgeStyle: "bg-accent text-accent-foreground",
    label: "Access",
  },
};

export const Route = createFileRoute("/notifications")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Notifications — Milan Hub" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { products } = useAppState();
  const stockCounts = products.reduce<Record<StockStatus, number>>(
    (counts, product) => {
      counts[statusOf(product)] += 1;
      return counts;
    },
    { "in-stock": 0, "low-stock": 0, "out-of-stock": 0 },
  );
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const loadRequests = () =>
    void apiRequest<{ requests: AccessRequest[] }>("/access-requests").then(
      (result) => result && setRequests(result.requests),
    );
  const loadNotifications = () =>
    void apiRequest<{ notifications: StoredNotification[] }>("/notifications").then(
      (result) => result && setNotifications(result.notifications),
    );
  useEffect(() => {
    loadRequests();
    loadNotifications();
  }, []);
  const review = (requestId: string, status: "approved" | "rejected") =>
    void apiRequest(`/access-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }).then(loadRequests);

  return (
    <DashboardShell
      title="Notifications"
      subtitle="Stay updated with your stock alerts and activities"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-3 py-1 text-xs font-medium text-destructive">
          <XCircle className="size-3.5" /> {stockCounts["out-of-stock"]} out of stock
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/12 px-3 py-1 text-xs font-medium text-warning">
          <TriangleAlert className="size-3.5" /> {stockCounts["low-stock"]} low stock
        </span>
      </div>
      <section className="panel p-5 lg:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
            <Bell className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Pending Access Requests</h2>
            <p className="text-xs text-muted-foreground">
              Approve or reject new user signup requests
            </p>
          </div>
        </div>
        <div className="mt-5 grid min-h-[124px] place-items-center rounded-xl border border-dashed border-border bg-surface-2/30">
          <div className="text-center">
            <ShieldCheck className="mx-auto size-6 text-muted-foreground" />
            {requests.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No pending requests</p>
            ) : (
              <div className="w-full space-y-2 p-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{request.email}</p>
                      <p className="text-xs text-muted-foreground">{request.role}</p>
                    </div>
                    <button
                      onClick={() => review(request._id, "rejected")}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => review(request._id, "approved")}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="panel mt-4 p-5 lg:p-6">
        <h2 className="text-base font-semibold">Stock Alerts</h2>
        <p className="mt-1 text-xs text-muted-foreground">Products that need attention</p>
        <div className="mt-4 grid min-h-[72px] place-items-center rounded-xl border border-dashed border-border bg-surface-2/30 text-center text-xs text-muted-foreground">
          {stockCounts["out-of-stock"] + stockCounts["low-stock"] === 0
            ? "No active stock alerts. Inventory levels are healthy."
            : `${stockCounts["out-of-stock"] + stockCounts["low-stock"]} products need attention.`}
        </div>
      </section>
      <section className="mt-5 border-t border-border pt-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Saved Notifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">Recent system activity</p>
          </div>
          <span className="text-xs text-muted-foreground">{notifications.length} events</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notifications.slice(0, 30).map((notification) => (
            <article
              key={notification.id}
              className="flex min-h-28 items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/35"
            >
              {(() => {
                const style = notificationStyle[notification.kind] ?? {
                  icon: CircleDot,
                  iconStyle: "bg-surface-2 text-muted-foreground",
                  badgeStyle: "bg-surface-2 text-muted-foreground",
                  label: notification.kind,
                };
                const Icon = style.icon;
                return (
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${style.iconStyle}`}>
                    <Icon className="size-[18px]" />
                  </span>
                );
              })()}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${notificationStyle[notification.kind]?.badgeStyle ?? "bg-surface-2 text-muted-foreground"}`}
                  >
                    {notificationStyle[notification.kind]?.label ?? notification.kind}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {notification.message}
                </p>
                <time className="mt-3 block text-[11px] text-muted-foreground/80">
                  {new Intl.DateTimeFormat("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(notification.createdAt))}
                </time>
              </div>
            </article>
          ))}
          {notifications.length === 0 && (
            <p className="col-span-full rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No saved notifications.
            </p>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
