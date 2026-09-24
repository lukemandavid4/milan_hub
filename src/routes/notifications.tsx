import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, ShieldCheck, TriangleAlert, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiRequest } from "@/lib/api";
import { statusOf, type StockStatus } from "@/data/inventory";
import { useAppState } from "@/lib/store";

type AccessRequest = { _id: string; email: string; role: string; createdAt: string };

export const Route = createFileRoute("/notifications")({
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
  const loadRequests = () =>
    void apiRequest<{ requests: AccessRequest[] }>("/access-requests").then(
      (result) => result && setRequests(result.requests),
    );
  useEffect(() => {
    loadRequests();
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
    </DashboardShell>
  );
}
