import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Box, ChartNoAxesColumnIncreasing, Save } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { apiRequest } from "@/lib/api";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { requireSession } from "@/lib/session";

type SavedReport = { id: string; title: string; generatedAt: string };

export const Route = createFileRoute("/report")({
  beforeLoad: requireSession,
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
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  useEffect(() => {
    void apiRequest<{ reports: SavedReport[] }>("/reports").then((result) => {
      if (result) setSavedReports(result.reports);
    });
  }, []);
  const movement = useMemo(() => {
    const byDate = new Map<string, { date: string; added: number; deducted: number }>();
    history.forEach((entry) => {
      const date = entry.at.slice(0, 10);
      const row = byDate.get(date) ?? { date, added: 0, deducted: 0 };
      if (entry.action.includes("Added") || entry.action === "Created") row.added += entry.qty;
      if (
        entry.action.includes("Deducted") ||
        entry.action === "Sold" ||
        entry.action === "Deleted"
      )
        row.deducted += entry.qty;
      byDate.set(date, row);
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [history]);
  const metrics = [
    {
      label: "Total Added",
      value: history
        .filter((entry) => entry.action.includes("Added") || entry.action === "Created")
        .reduce((sum, entry) => sum + entry.qty, 0),
      icon: ArrowUpRight,
      style: "text-primary bg-primary/12",
    },
    {
      label: "Total Deducted",
      value: history
        .filter(
          (entry) =>
            entry.action.includes("Deducted") ||
            entry.action === "Sold" ||
            entry.action === "Deleted",
        )
        .reduce((sum, entry) => sum + entry.qty, 0),
      icon: ArrowDownRight,
      style: "text-destructive bg-destructive/12",
    },
    {
      label: "Total Transactions",
      value: history.length,
      icon: Box,
      style: "text-primary bg-primary/12",
    },
    {
      label: "Avg Daily Movement",
      value: movement.length
        ? Math.round(history.reduce((sum, entry) => sum + entry.qty, 0) / movement.length)
        : 0,
      icon: ChartNoAxesColumnIncreasing,
      style: "text-warning bg-warning/12",
    },
  ];
  const saveReport = async () => {
    const generatedAt = new Date().toISOString();
    const result = await apiRequest<{ report: SavedReport }>("/reports", {
      method: "POST",
      body: JSON.stringify({
        title: `Stock Report · ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(generatedAt))}`,
        data: {
          movement,
          totals: {
            added: metrics[0].value,
            deducted: metrics[1].value,
            transactions: history.length,
            quantityChanged: history.reduce((sum, entry) => sum + entry.qty, 0),
          },
        },
      }),
    });
    if (!result) {
      toast.error("Report could not be saved to the database");
      return;
    }
    setSavedReports((reports) => [result.report, ...reports]);
    toast.success("Report snapshot saved");
  };
  return (
    <DashboardShell
      title="Stock Report"
      subtitle="30-day inventory movement overview"
      action={
        <button
          type="button"
          onClick={saveReport}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground sm:px-4 sm:text-sm"
        >
          <Save className="size-4" /> Save Report
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, style }) => (
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
        <div className="mt-6 h-[310px]">
          {movement.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movement}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border)"
                  strokeDasharray="4 6"
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
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
                <p className="mt-3 text-sm text-muted-foreground">
                  No stock movement recorded yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel mt-5 p-5 lg:p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest stock movements in the last 30 days
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
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
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No stock activity yet.
                  </td>
                </tr>
              )}
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-border/70 text-muted-foreground">
                  <td className="px-3 py-3 text-foreground">{entry.name}</td>
                  <td className="px-3 py-3">{entry.action}</td>
                  <td className="px-3 py-3 text-right">{entry.qty}</td>
                  <td className="px-3 py-3 text-right">{entry.before}</td>
                  <td className="px-3 py-3 text-right">{entry.after}</td>
                  <td className="px-3 py-3">
                    {new Intl.DateTimeFormat("en-KE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.at))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-5 border-t border-border pt-5">
        <h2 className="text-base font-semibold">Saved Reports</h2>
        <div className="mt-3 space-y-2">
          {savedReports.slice(0, 8).map((report) => (
            <div
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 py-3 text-sm"
            >
              <span className="font-medium">{report.title}</span>
              <time className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-KE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(report.generatedAt))}
              </time>
            </div>
          ))}
          {savedReports.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">No saved report snapshots.</p>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
