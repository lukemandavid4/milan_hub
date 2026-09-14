import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Banknote, ShoppingCart, Wallet, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthKey, monthLabel, recentMonthOptions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

const toneMap = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-primary/10 text-primary",
  warning: "bg-warning/12 text-warning",
  success: "bg-emerald-500/15 text-emerald-400",
};

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue — Milan Hub" },
      { name: "description", content: "Monthly revenue performance for Milan Hub." },
      { property: "og:title", content: "Revenue — Milan Hub" },
      { property: "og:description", content: "Track monthly sales revenue for Milan Hub." },
    ],
  }),
  component: RevenuePage,
});

function RevenuePage() {
  const { sales } = useAppState();
  const [selectedMonth, setSelectedMonth] = useState(() => recentMonthOptions()[0]?.key ?? "all");

  const monthOptions = useMemo(() => {
    const monthKeys = new Set(sales.map((sale) => monthKey(sale.soldAt)));
    const recentMonths = recentMonthOptions();
    const recentMonthKeys = new Set(recentMonths.map((option) => option.key));
    const recordedMonths = Array.from(monthKeys)
      .filter((key) => !recentMonthKeys.has(key))
      .sort()
      .reverse()
      .map((key) => ({ key, label: monthLabel(key) }));

    return [{ key: "all", label: "All Months" }, ...recentMonths, ...recordedMonths];
  }, [sales]);

  const selectedMonthLabel =
    monthOptions.find((option) => option.key === selectedMonth)?.label ?? "All Months";

  const filteredSales = useMemo(() => {
    if (selectedMonth === "all") return sales;

    return sales.filter((sale) => monthKey(sale.soldAt) === selectedMonth);
  }, [sales, selectedMonth]);

  const revenueByMonth = useMemo(() => {
    const grouped = filteredSales.reduce<Record<string, number>>((acc, sale) => {
      const month = new Date(sale.soldAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      acc[month] = (acc[month] ?? 0) + sale.price * sale.qty;
      return acc;
    }, {});

    return Object.entries(grouped).map(([month, revenue]) => ({ month, revenue }));
  }, [filteredSales]);

  const chartData =
    selectedMonth === "all"
      ? revenueByMonth
      : [
          {
            month: selectedMonthLabel,
            revenue: filteredSales.reduce((sum, sale) => sum + sale.price * sale.qty, 0),
          },
        ];

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.price * sale.qty, 0);
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.qty, 0);
  const cashSales = filteredSales
    .filter((sale) => sale.payment === "Cash")
    .reduce((sum, sale) => sum + sale.price * sale.qty, 0);
  const mpesaSales = filteredSales
    .filter((sale) => sale.payment === "M-Pesa")
    .reduce((sum, sale) => sum + sale.price * sale.qty, 0);

  const metrics = [
    {
      label: "Total Revenue",
      value: filteredSales.length ? `KES ${totalRevenue.toLocaleString()}` : "KES 0",
      sub: selectedMonth === "all" ? "All recorded sales" : `${selectedMonthLabel} total`,
      icon: Banknote,
      tone: "primary",
    },
    {
      label: "Total Sales",
      value: String(totalSales || 0),
      sub: selectedMonth === "all" ? "Units sold" : `${selectedMonthLabel} units`,
      icon: ShoppingCart,
      tone: "accent",
    },
    {
      label: "Cash Sales",
      value: filteredSales.length ? `KES ${cashSales.toLocaleString()}` : "KES 0",
      sub: "Cash transactions",
      icon: Wallet,
      tone: "warning",
    },
    {
      label: "M-Pesa Sales",
      value: filteredSales.length ? `KES ${mpesaSales.toLocaleString()}` : "KES 0",
      sub: "Mobile payments",
      icon: TrendingUp,
      tone: "success",
    },
  ];

  if (getCurrentUser()?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <DashboardShell
      title="Monthly Revenue"
      subtitle="Track your sales revenue month"
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, sub, icon: Icon, tone }) => (
          <section key={label} className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-3 font-display text-3xl font-bold text-foreground">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
              </div>
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-xl",
                  toneMap[tone as keyof typeof toneMap],
                )}
              >
                <Icon className="size-5" />
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className="panel mt-6 p-5 lg:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Revenue by Month</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly sales performance for Milan Hub
            </p>
          </div>
          {chartData.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <ArrowUpRight className="size-3.5" />
              {selectedMonth === "all" ? "All months" : selectedMonthLabel}
            </div>
          )}
        </div>

        <div className="h-[360px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
                  contentStyle={{
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    color: "var(--color-foreground)",
                    boxShadow: "var(--shadow-glow)",
                  }}
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-border bg-surface-2/40 text-center">
              <div>
                <p className="text-lg font-semibold">No revenue data yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Revenue will appear here after products or services are added and sold.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
