import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Boxes, TriangleAlert, PackageX, RotateCw, ShoppingCart } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { categories, statusOf, type ActivityKind } from "@/data/inventory";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Milan Hub Inventory Control" },
      {
        name: "description",
        content:
          "Milan Hub dashboard: live stock totals, low-stock alerts, category analytics and recent inventory activity.",
      },
      { property: "og:title", content: "Dashboard — Milan Hub Inventory Control" },
      {
        property: "og:description",
        content: "Track total stock, low-stock items and out-of-stock products in real time.",
      },
    ],
  }),
  component: Dashboard,
});

const toneStyles = {
  primary: {
    icon: "bg-primary/12 text-primary glow-ring",
    value: "text-primary",
  },
  warning: {
    icon: "bg-warning/12 text-warning",
    value: "text-warning",
  },
  destructive: {
    icon: "bg-destructive/12 text-destructive",
    value: "text-destructive",
  },
};

const activityStyles: Record<
  ActivityKind,
  { icon: React.ComponentType<{ className?: string }>; wrap: string; tag: string }
> = {
  low: {
    icon: TriangleAlert,
    wrap: "bg-warning/12 text-warning",
    tag: "bg-warning/12 text-warning",
  },
  out: {
    icon: PackageX,
    wrap: "bg-destructive/12 text-destructive",
    tag: "bg-destructive/12 text-destructive",
  },
  restock: {
    icon: RotateCw,
    wrap: "bg-primary/12 text-primary",
    tag: "bg-primary/12 text-primary",
  },
  sale: {
    icon: ShoppingCart,
    wrap: "bg-accent text-accent-foreground",
    tag: "bg-primary/10 text-primary",
  },
};

function Dashboard() {
  const { products, history } = useAppState();
  const totals = useMemo(
    () => ({
      units: products.reduce((sum, product) => sum + product.quantity, 0),
      skus: products.length,
      low: products.filter((product) => statusOf(product) === "low-stock").length,
      out: products.filter((product) => statusOf(product) === "out-of-stock").length,
    }),
    [products],
  );
  const categoryStock = categories.map((category) => ({
    category,
    units: products
      .filter((product) => product.category === category)
      .reduce((sum, product) => sum + product.quantity, 0),
  }));
  const activity = history.slice(0, 8).map((entry) => ({
    id: entry.id,
    kind: entry.action.includes("Sold")
      ? "sale"
      : entry.after === 0
        ? "out"
        : entry.after <= entry.before
          ? "low"
          : "restock",
    name: entry.name,
    spec: `${entry.action} · ${entry.qty} items`,
    tag: entry.action,
    time: new Intl.DateTimeFormat("en-KE", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(entry.at)),
  }));
  const kpis = [
    {
      label: "Total Stock",
      value: totals.units.toLocaleString(),
      sub: `${totals.skus} unique products tracked`,
      icon: Boxes,
      tone: "primary" as const,
    },
    {
      label: "Low Stock Items",
      value: String(totals.low),
      sub: "Below reorder threshold",
      icon: TriangleAlert,
      tone: "warning" as const,
    },
    {
      label: "Out of Stock",
      value: String(totals.out),
      sub: "Unavailable for sale",
      icon: PackageX,
      tone: "destructive" as const,
    },
  ];
  return (
    <DashboardShell title="Dashboard" subtitle="Welcome back! Here's your stock report">
      <div className="grid gap-5 md:grid-cols-3">
        {kpis.map(({ label, value, sub, icon: Icon, tone }) => {
          const s = toneStyles[tone];
          return (
            <div
              key={label}
              className="panel group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <p className={cn("mt-3 font-display text-4xl font-bold", s.value)}>{value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
                </div>
                <span className={cn("grid size-11 place-items-center rounded-xl", s.icon)}>
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <section className="panel p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Stock by Category</h2>
              <p className="text-sm text-muted-foreground">Units on hand across product lines</p>
            </div>
          </div>
          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStock} barSize={38}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="category"
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
                    border: "1px solid var(--color-primary)",
                    borderRadius: "12px",
                    color: "var(--color-foreground)",
                    boxShadow: "var(--shadow-glow)",
                  }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                />
                <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                  {categoryStock.map((entry) => (
                    <Cell key={entry.category} fill="var(--color-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Live stock movement feed</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary" /> Live
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {activity.map((a) => {
              const s = activityStyles[a.kind];
              const Icon = s.icon;
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-2/60"
                >
                  <span
                    className={cn("grid size-9 shrink-0 place-items-center rounded-lg", s.wrap)}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.spec}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        s.tag,
                      )}
                    >
                      {a.tag}
                    </span>
                    <p className="mt-1 text-[11px] text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              );
            })}
            {activity.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                No recent activity yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
