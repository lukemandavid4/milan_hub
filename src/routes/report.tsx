import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Box, ChartNoAxesColumnIncreasing } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Stock Report — Milan Hub" },
      {
        name: "description",
        content: "Review Milan Hub stock movement totals, charts and recent inventory activity.",
      },
      { property: "og:title", content: "Stock Report — Milan Hub" },
      {
        property: "og:description",
        content: "Inventory movement totals and recent stock activity for Milan Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { history } = useAppState();
  const reportData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
    const recentHistory = history.filter((entry) => new Date(entry.at) >= cutoff);
    const movement = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (13 - index));
      const key = date.toISOString().slice(0, 10);
      const dayEntries = recentHistory.filter((entry) => entry.at.slice(0, 10) === key);
      return {
        date: date.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
        added: dayEntries
          .filter((entry) => entry.action === "Created" || entry.action === "Stock Added")
          .reduce((sum, entry) => sum + entry.qty, 0),
        deducted: dayEntries
          .filter((entry) => entry.action === "Sold" || entry.action === "Stock Deducted")
          .reduce((sum, entry) => sum + entry.qty, 0),
      };
    });
    const totalAdded = recentHistory
      .filter((entry) => entry.action === "Created" || entry.action === "Stock Added")
      .reduce((sum, entry) => sum + entry.qty, 0);
    const totalDeducted = recentHistory
      .filter((entry) => entry.action === "Sold" || entry.action === "Stock Deducted")
      .reduce((sum, entry) => sum + entry.qty, 0);

    return {
      movement,
      recentHistory,
      metrics: [
        { label: "Total Added", value: totalAdded, icon: ArrowUpRight, style: "text-primary bg-primary/12" },
        { label: "Total Deducted", value: totalDeducted, icon: ArrowDownRight, style: "text-destructive bg-destructive/12" },
        { label: "Total Transactions", value: recentHistory.length, icon: Box, style: "text-primary bg-primary/12" },
        { label: "Avg Daily Movement", value: Math.round((totalAdded + totalDeducted) / 30), icon: ChartNoAxesColumnIncreasing, style: "text-warning bg-warning/12" },
      ],
    };
  }, [history]);

  return (
    <DashboardShell title="Stock Report" subtitle="30-day inventory movement overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportData.metrics.map(({ label, value, icon: Icon, style }) => (
          <section key={label} className="panel flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
            </div>
            <span className={cn("grid size-10 place-items-center rounded-full", style)}>
              <Icon className="size-5" />
            </span>
          </section>
        ))}
      </div>

      <section className="panel mt-5 p-5 lg:p-6">
        <h2 className="text-lg font-semibold">Daily Stock Movement</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stock additions and deductions over the last 14 days
        </p>
        <div className="mt-6 h-77.5">
          {reportData.movement.some((day) => day.added > 0 || day.deducted > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.movement}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 6" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
                  contentStyle={{
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-foreground)",
                  }}
                />
                <Bar dataKey="added" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deducted" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <ChartNoAxesColumnIncreasing className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No stock movement recorded yet.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel mt-5 p-5 lg:p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Latest stock movements in the last 30 days</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-180 text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Action</th>
                <th className="px-3 py-3 text-right font-medium">Qty Changed</th>
                <th className="px-3 py-3 text-right font-medium">Before</th>
                <th className="px-3 py-3 text-right font-medium">After</th>
                <th className="px-3 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {reportData.recentHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No stock activity yet.
                  </td>
                </tr>
              )}
              {reportData.recentHistory.map((entry) => (
                <tr key={entry.id} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-3 font-medium">{entry.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{entry.action}</td>
                  <td className="px-3 py-3 text-right">{entry.qty}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{entry.before}</td>
                  <td className="px-3 py-3 text-right">{entry.after}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {new Date(entry.at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}