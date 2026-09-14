import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthKey, monthLabel, recentMonthOptions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Milan Hub" },
      { name: "description", content: "Review sales and service history for Milan Hub." },
      { property: "og:title", content: "History — Milan Hub" },
      { property: "og:description", content: "Track Milan Hub product and service history." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history } = useAppState();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState(() => recentMonthOptions()[0]?.key ?? "all");

  const monthOptions = useMemo(() => {
    const monthKeys = new Set(history.map((record) => monthKey(record.at)));
    const recentMonths = recentMonthOptions();
    const recentMonthKeys = new Set(recentMonths.map((option) => option.key));
    const recordedMonths = Array.from(monthKeys)
      .filter((key) => !recentMonthKeys.has(key))
      .sort()
      .reverse()
      .map((key) => ({ key, label: monthLabel(key) }));

    return [{ key: "all", label: "All Months" }, ...recentMonths, ...recordedMonths];
  }, [history]);

  const selectedMonthLabel =
    monthOptions.find((option) => option.key === selectedMonth)?.label ?? "All Months";

  const filteredRecords = useMemo(() => {
    return history.filter((record) => {
      const matchesMonth = selectedMonth === "all" || monthKey(record.at) === selectedMonth;
      const matchesFilter = selected === "All" || record.kind === selected.toLowerCase();
      const text = `${record.name} ${record.action}`.toLowerCase();
      return matchesMonth && matchesFilter && text.includes(query.toLowerCase());
    });
  }, [history, query, selected, selectedMonth]);

  const totalSales = filteredRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <DashboardShell
      title="History"
      subtitle="Track all product changes and services"
      action={
        <div className="relative">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/50 focus-within:border-primary/60">
            <span className="whitespace-nowrap">Month</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-auto min-w-40 border-0 bg-transparent px-0 py-0 text-foreground shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72 border-primary/30 bg-popover shadow-glow">
                {monthOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    value={option.key}
                    className="py-2.5 focus:bg-primary/20 focus:text-foreground"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      }
    >
      <div className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Product", "Service"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelected(tab)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selected === tab
                    ? "bg-primary/12 text-primary"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or services..."
              className="w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3.5" />
            {filteredRecords.length} records
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            KES {totalSales.toLocaleString()} total
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {filteredRecords.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-2/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-primary/12 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.action} • {entry.qty} item{entry.qty === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {entry.kind === "product" ? "Product" : "Service"}
                </span>
                <span>
                  {new Date(entry.at).toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-10 text-center text-sm text-muted-foreground">
              No records for {selectedMonth === "all" ? "this period" : selectedMonthLabel}.
              Activity will appear here as products and services are updated.
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
