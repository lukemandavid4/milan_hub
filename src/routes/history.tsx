import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PackagePlus, RefreshCw, Search, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { monthKey, useAppState } from "@/lib/store";
import { requireSession } from "@/lib/session";

export const Route = createFileRoute("/history")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "History — Milan Hub" }] }),
  component: HistoryPage,
});

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2026, index, 1)),
  value: `2026-${String(index + 1).padStart(2, "0")}`,
}));

function HistoryPage() {
  const { history } = useAppState();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date().toISOString()));
  const [filter, setFilter] = useState<"all" | "product" | "service">("all");
  const [query, setQuery] = useState("");
  const filteredHistory = useMemo(
    () =>
      history.filter((record) => {
        const matchesMonth = monthKey(record.at) === selectedMonth;
        const matchesType = filter === "all" || record.kind === filter;
        const matchesQuery =
          !query.trim() || record.name.toLowerCase().includes(query.trim().toLowerCase());
        return matchesMonth && matchesType && matchesQuery;
      }),
    [filter, history, query, selectedMonth],
  );
  const total = filteredHistory.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <DashboardShell
      title="History"
      subtitle="Track all product changes and services"
      action={
        <div className="flex items-center gap-2">
          <select
            aria-label="Select month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-10 rounded-lg border border-border bg-surface-2 px-3 text-xs text-muted-foreground outline-none"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} 2026
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Refresh history"
            onClick={() => window.location.reload()}
            className="grid size-10 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      }
    >
      <section className="w-full">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={
                filter === "all"
                  ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  : "rounded-md border border-transparent bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              All Activity
            </button>
            <button
              onClick={() => setFilter("product")}
              className={
                filter === "product"
                  ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  : "rounded-md border border-transparent bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              Product
            </button>
            <button
              onClick={() => setFilter("service")}
              className={
                filter === "service"
                  ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  : "rounded-md border border-transparent bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              }
            >
              Service
            </button>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-xs text-muted-foreground lg:w-[260px]">
            <Search className="size-4" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search products or services..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2 text-xs font-semibold">
          <span className="rounded-full bg-primary/12 px-2.5 py-1 text-primary">
            {filteredHistory.length} RECORDS
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted-foreground">
            KES {total.toLocaleString()} TOTAL
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {filteredHistory.map((record) => (
            <div
              key={record.id}
              className="flex min-h-[56px] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/30"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                {record.kind === "product" ? (
                  <PackagePlus className="size-4" />
                ) : (
                  <Wrench className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{record.name}</p>
                <p className="text-xs text-muted-foreground">
                  {record.action} · {record.qty} items · KES {record.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {record.kind === "product" ? "Product" : "Service"}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(record.at))}
                </span>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No history recorded yet.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
