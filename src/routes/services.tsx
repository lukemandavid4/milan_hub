import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Wrench } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { actions, useAppState } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Milan Hub" },
      {
        name: "description",
        content: "Record services performed and review recent service sales at Milan Hub.",
      },
      { property: "og:title", content: "Services — Milan Hub" },
      {
        property: "og:description",
        content: "Record and track service sales for Milan Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { services } = useAppState();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [payment, setPayment] = useState("M-Pesa");

  const addService = () => {
    const amount = Number(price);
    if (!name.trim() || !Number.isFinite(amount) || amount <= 0) return;

    actions.addService({
      name: name.trim(),
      price: amount,
      description: description.trim(),
      payment,
    });

    setName("");
    setPrice("");
    setDescription("");
  };

  return (
    <DashboardShell title="Services" subtitle="Record services performed and add to daily sales">
      <section className="panel p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
            <Wrench className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Add New Service</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a service you performed. It will be added to your daily sales.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name *</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Screen Replacement"
              className="bg-surface-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-price">Price (KES) *</Label>
            <Input
              id="service-price"
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
              className="bg-surface-2"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="service-description">Description (Optional)</Label>
            <Textarea
              id="service-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter service details..."
              className="min-h-24 bg-surface-2"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Payment Method *</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="bg-surface-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          onClick={addService}
          className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow glow-ring"
        >
          Add Service to Daily Sales
        </button>
      </section>

      <section className="panel mt-5 p-5 lg:p-6">
        <h2 className="text-lg font-semibold">Recent Services</h2>
        <p className="mt-1 text-sm text-muted-foreground">Services performed recently</p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-3 font-medium">Service</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Payment</th>
                <th className="px-3 py-3 text-right font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b border-border/70 hover:bg-surface-2/60">
                  <td className="px-3 py-4 font-medium">{service.name}</td>
                  <td className="max-w-64 truncate px-3 py-4 text-muted-foreground">
                    {service.description || "—"}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{service.payment}</td>
                  <td className="px-3 py-4 text-right">KES {service.price.toLocaleString()}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {new Intl.DateTimeFormat("en-KE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(service.at))}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button
                      aria-label={`Delete ${service.name}`}
                      onClick={() => actions.deleteService(service.id)}
                      className="inline-grid size-8 place-items-center rounded-lg text-destructive transition-colors hover:bg-destructive/12"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    No services recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}