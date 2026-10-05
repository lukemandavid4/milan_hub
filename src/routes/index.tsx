import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { requireSession } from "@/lib/session";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  beforeLoad: requireSession,
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
  const [stockView, setStockView] = useState<"low-stock" | "out-of-stock" | null>(null);
  const [activityExpanded, setActivityExpanded] = useState(false);
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
  const activity = history.map((entry) => ({
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
  const stockProducts = stockView
    ? products.filter((product) => statusOf(product) === stockView)
    : [];
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
          const content = (
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
          );
          const className =
            "panel group relative w-full overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40";

          if (tone === "warning" || tone === "destructive") {
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStockView(tone === "warning" ? "low-stock" : "out-of-stock")}
                className={cn(className, "cursor-pointer")}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={label} className={className}>
              {content}
            </div>
          );
        })}
      </div>

      <Dialog open={stockView !== null} onOpenChange={(open) => !open && setStockView(null)}>
        <DialogContent className="grid max-h-[80vh] max-w-xl grid-rows-[auto_1fr]">
          <DialogHeader>
            <DialogTitle>
              {stockView === "low-stock" ? "Low Stock Items" : "Out of Stock Items"}
            </DialogTitle>
            <DialogDescription>
              {stockProducts.length} {stockProducts.length === 1 ? "product" : "products"}
            </DialogDescription>
          </DialogHeader>
          <div className="thin-scrollbar min-h-0 overflow-y-auto pr-2">
            {stockProducts.length > 0 ? (
              <ul className="divide-y divide-border">
                {stockProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {product.category} · {product.sku}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm font-semibold">
                      {product.quantity}{" "}
                      <span className="font-normal text-muted-foreground">in stock</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No {stockView === "low-stock" ? "low-stock" : "out-of-stock"} products.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6 grid gap-5 lg:items-stretch lg:grid-cols-5">
        <section className="panel flex h-[430px] min-h-0 flex-col p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Stock by Category</h2>
              <p className="text-sm text-muted-foreground">Units on hand across product lines</p>
            </div>
          </div>
          <div className="mt-6 min-h-0 flex-1">
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

        <section
          className={cn(
            "panel flex min-h-0 flex-col p-5 transition-[height] duration-300 lg:col-span-2",
            activityExpanded ? "h-[560px]" : "h-[430px]",
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Stock movement feed</p>
            </div>
            <button
              type="button"
              aria-expanded={activityExpanded}
              onClick={() => setActivityExpanded((expanded) => !expanded)}
              className="text-sm font-medium text-primary transition-colors hover:text-primary-glow"
            >
              {activityExpanded ? "Show less" : "View all"}
            </button>
          </div>
          <ul className="thin-scrollbar mt-4 min-h-0 flex-1 divide-y divide-border overflow-y-auto">
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
