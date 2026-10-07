import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Download,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { DashboardShell } from "@/components/DashboardShell";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { requireSession } from "@/lib/session";

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
  const { products, history } = useAppState();
  const monthInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const dateParts = (value: string) => {
    const date = new Date(value);
    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      day: date.getDate(),
    };
  };
  const productsAddedThisMonth = useMemo(
    () => products.filter((product) => dateParts(product.createdAt).month === selectedMonth),
    [products, selectedMonth],
  );
  const stockHistory = useMemo(
    () =>
      history.filter(
        (entry) => entry.kind === "product" && dateParts(entry.at).month === selectedMonth,
      ),
    [history, selectedMonth],
  );
  const movement = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDate = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      added: 0,
      deducted: 0,
    }));
    stockHistory.forEach((entry) => {
      const row = byDate[dateParts(entry.at).day - 1];
      if (!row) return;
      const change = entry.after - entry.before;
      if (change > 0) row.added += change;
      if (change < 0) row.deducted += Math.abs(change);
    });
    return byDate;
  }, [selectedMonth, stockHistory]);
  const hasMovement = movement.some((day) => day.added > 0 || day.deducted > 0);
  const totalAdded = productsAddedThisMonth.reduce((sum, product) => sum + product.quantity, 0);
  const totalDeducted = stockHistory.reduce(
    (sum, entry) => sum + Math.max(0, entry.before - entry.after),
    0,
  );
  const metrics = [
    {
      label: "Total Added",
      value: totalAdded,
      icon: ArrowUpRight,
      style: "text-primary bg-primary/12",
    },
    {
      label: "Total Deducted",
      value: totalDeducted,
      icon: ArrowDownRight,
      style: "text-destructive bg-destructive/12",
    },
    {
      label: "Total Transactions",
      value: stockHistory.length,
      icon: Box,
      style: "text-primary bg-primary/12",
    },
    {
      label: "Avg Daily Movement",
      value: movement.length
        ? Math.round(stockHistory.reduce((sum, entry) => sum + entry.qty, 0) / movement.length)
        : 0,
      icon: ChartNoAxesColumnIncreasing,
      style: "text-warning bg-warning/12",
    },
  ];
  const monthLabel = new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedMonth}-01T12:00:00`));
  const downloadReport = () => {
    const pdf = new jsPDF({ orientation: "landscape" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const monthTitle = monthLabel;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Milan Hub Stock Report", 14, 17);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(monthTitle, 14, 25);
    pdf.setFontSize(9);
    pdf.text(
      `Generated ${new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date())}`,
      pageWidth - 14,
      17,
      { align: "right" },
    );

    pdf.setDrawColor(210, 216, 214);
    pdf.line(14, 31, pageWidth - 14, 31);
    pdf.setFontSize(10);
    pdf.text(`Units added: ${metrics[0].value.toLocaleString()}`, 14, 40);
    pdf.text(`Units deducted: ${metrics[1].value.toLocaleString()}`, 82, 40);
    pdf.text(`Transactions: ${metrics[2].value.toLocaleString()}`, 166, 40);

    const chartLeft = 16;
    const chartTop = 54;
    const chartWidth = pageWidth - 32;
    const chartHeight = 49;
    const maxValue = Math.max(1, ...movement.flatMap((day) => [day.added, day.deducted]));
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Daily Stock Movement", chartLeft, 50);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    for (let line = 0; line <= 4; line += 1) {
      const y = chartTop + (chartHeight * line) / 4;
      pdf.setDrawColor(226, 231, 229);
      pdf.line(chartLeft, y, chartLeft + chartWidth, y);
      pdf.setTextColor(100, 108, 106);
      pdf.text(String(Math.round((maxValue * (4 - line)) / 4)), chartLeft - 2, y - 1, {
        align: "right",
      });
    }
    const slotWidth = chartWidth / movement.length;
    const barWidth = Math.max(1, Math.min(4, slotWidth * 0.28));
    movement.forEach((day, index) => {
      const center = chartLeft + slotWidth * (index + 0.5);
      const addedHeight = (day.added / maxValue) * chartHeight;
      const deductedHeight = (day.deducted / maxValue) * chartHeight;
      pdf.setFillColor(28, 168, 105);
      if (addedHeight > 0)
        pdf.rect(
          center - barWidth - 0.5,
          chartTop + chartHeight - addedHeight,
          barWidth,
          addedHeight,
          "F",
        );
      pdf.setFillColor(220, 65, 65);
      if (deductedHeight > 0)
        pdf.rect(
          center + 0.5,
          chartTop + chartHeight - deductedHeight,
          barWidth,
          deductedHeight,
          "F",
        );
      if (index % (movement.length > 20 ? 3 : 1) === 0) {
        pdf.setTextColor(90, 98, 96);
        pdf.text(String(day.day), center, chartTop + chartHeight + 6, { align: "center" });
      }
    });
    pdf.setFillColor(28, 168, 105);
    pdf.rect(pageWidth - 72, 48, 3, 3, "F");
    pdf.setTextColor(65, 73, 71);
    pdf.text("Added", pageWidth - 67, 51);
    pdf.setFillColor(220, 65, 65);
    pdf.rect(pageWidth - 42, 48, 3, 3, "F");
    pdf.text("Deducted", pageWidth - 37, 51);

    let rowY = 122;
    const columnX = [14, 92, 124, 162, 184, 220];
    const tableHeaders = ["Item", "Type", "Action", "Qty", "Amount (KES)", "Date"];
    const drawTableHeader = () => {
      pdf.setFillColor(239, 243, 241);
      pdf.rect(14, rowY - 5, pageWidth - 28, 9, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(35, 43, 41);
      tableHeaders.forEach((header, index) => pdf.text(header, columnX[index], rowY));
      rowY += 10;
      pdf.setFont("helvetica", "normal");
    };
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(25, 33, 31);
    pdf.text("Monthly Activity", 14, 116);
    drawTableHeader();
    const sortedHistory = [...stockHistory].sort(
      (first, second) => new Date(second.at).getTime() - new Date(first.at).getTime(),
    );
    if (sortedHistory.length === 0) {
      pdf.setFontSize(9);
      pdf.text("No stock activity recorded for this month.", 14, rowY + 3);
    }
    for (const entry of sortedHistory) {
      if (rowY > 195) {
        pdf.addPage();
        rowY = 18;
        drawTableHeader();
      }
      const values = [
        pdf.splitTextToSize(entry.name, 72)[0] ?? entry.name,
        "Product",
        entry.action,
        String(entry.qty),
        entry.amount.toLocaleString(),
        new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(entry.at)),
      ];
      pdf.setFontSize(8);
      pdf.setTextColor(55, 63, 61);
      values.forEach((value, index) => pdf.text(value, columnX[index], rowY));
      pdf.setDrawColor(232, 236, 234);
      pdf.line(14, rowY + 3, pageWidth - 14, rowY + 3);
      rowY += 9;
    }
    pdf.save(`milan-hub-stock-report-${selectedMonth}.pdf`);
  };
  return (
    <DashboardShell
      title="Stock Report"
      subtitle={`Inventory movement for ${monthLabel}`}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Choose report month. Current month: ${monthLabel}`}
            onClick={() => {
              if (monthInputRef.current?.showPicker) {
                monthInputRef.current.showPicker();
              } else {
                monthInputRef.current?.click();
              }
            }}
            className="inline-flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
          >
            <CalendarDays className="size-4" />
            <span>{monthLabel}</span>
          </button>
          <input
            ref={monthInputRef}
            aria-label="Report month"
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              if (event.target.value) setSelectedMonth(event.target.value);
            }}
            className="sr-only"
          />
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground sm:px-4 sm:text-sm"
          >
            <Download className="size-4" /> Download PDF
          </button>
        </div>
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
          Product stock additions and deductions for {monthLabel}
        </p>
        <div className="mt-6 h-[310px]">
          {hasMovement ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movement} barCategoryGap="22%" barGap={4}>
                <CartesianGrid vertical stroke="var(--color-border)" strokeDasharray="4 6" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(day: number) => String(day)}
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  allowDecimals={false}
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
                <Bar
                  dataKey="added"
                  name="Added"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="deducted"
                  name="Deducted"
                  fill="var(--color-destructive)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-lg border border-dashed border-border">
              <div className="text-center">
                <ChartNoAxesColumnIncreasing className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No stock movement recorded for {monthLabel}.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel mt-5 p-5 lg:p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stock movements recorded in {monthLabel}
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
              {stockHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No stock activity yet.
                  </td>
                </tr>
              )}
              {stockHistory.map((entry) => (
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
    </DashboardShell>
  );
}
