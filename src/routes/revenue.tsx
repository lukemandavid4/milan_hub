import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Banknote,
  ChartNoAxesColumnIncreasing,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/DashboardShell";
import { useAppState, monthKey } from "@/lib/store";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/revenue")({
  head: () => ({ meta: [{ title: "Monthly Revenue — Milan Hub" }] }),
  component: RevenuePage,
});

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2026, index, 1)),
  value: `2026-${String(index + 1).padStart(2, "0")}`,
}));

function RevenuePage() {
  const { sales } = useAppState();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date().toISOString()));
  const filteredSales = sales.filter((sale) => monthKey(sale.soldAt) === selectedMonth);
  const total = filteredSales.reduce((sum, sale) => sum + sale.price * sale.qty, 0);
  const cash = filteredSales
    .filter((sale) => sale.payment === "Cash")
    .reduce((sum, sale) => sum + sale.price * sale.qty, 0);
  const mobile = filteredSales
    .filter((sale) => sale.payment === "M-Pesa")
    .reduce((sum, sale) => sum + sale.price * sale.qty, 0);
  const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(`${selectedMonth}-01`),
  );
  const revenue = total > 0 ? [{ month, amount: total }] : [];
  const metrics = [
    {
      label: "Total Revenue",
      value: `KES ${total.toLocaleString()}`,
      sub: `${month} total`,
      icon: Banknote,
      style: "text-primary bg-primary/12",
    },
    {
      label: "Total Sales",
      value: String(filteredSales.reduce((sum, sale) => sum + sale.qty, 0)),
      sub: `${month} units`,
      icon: ShoppingCart,
      style: "text-primary bg-primary/12",
    },
    {
      label: "Cash Sales",
      value: `KES ${cash.toLocaleString()}`,
      sub: "Cash transactions",
      icon: CreditCard,
      style: "text-warning bg-warning/12",
    },
    {
      label: "M-Pesa Sales",
      value: `KES ${mobile.toLocaleString()}`,
      sub: "Mobile payments",
      icon: ArrowUpRight,
      style: "text-teal-400 bg-teal-400/12",
    },
  ];

  return (
    <DashboardShell
      title="Monthly Revenue"
      subtitle="Track your sales revenue month"
      action={
        <select
          aria-label="Select month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm text-muted-foreground outline-none"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} 2026
            </option>
          ))}
        </select>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, sub, icon: Icon, style }) => (
          <section key={label} className="panel flex min-h-[96px] items-start justify-between p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            </div>
            <span className={cn("grid size-9 place-items-center rounded-xl", style)}>
              <Icon className="size-4" />
            </span>
          </section>
        ))}
      </div>

      <section className="panel mt-4 p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Revenue by Month</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly sales performance for Milan Hub
            </p>
          </div>
          {revenue.length > 0 && (
            <span className="hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:inline-flex">
              <ArrowUpRight className="size-3" /> {month}
            </span>
          )}
        </div>
        <div className="mt-4 h-[270px]">
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-foreground)",
                  }}
                  formatter={(value) => [`KES ${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No revenue recorded yet.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
