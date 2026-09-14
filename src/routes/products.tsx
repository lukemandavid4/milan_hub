import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  Smartphone,
  Laptop,
  Volume2,
  Cable,
  Cpu,
  Wifi,
  CookingPot,
  Gamepad2,
  House,
  Watch,
  Box,
  Tablet,
  PackagePlus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import { actions, useAppState } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardShell } from "@/components/DashboardShell";
import { categories, statusLabels, statusOf, type Product } from "@/data/inventory";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Milan Hub Inventory" },
      {
        name: "description",
        content:
          "Browse, search and manage every Milan Hub product with live quantities, categories and stock status.",
      },
      { property: "og:title", content: "Products — Milan Hub Inventory" },
      {
        property: "og:description",
        content: "Full product inventory with category tiles, search and stock status badges.",
      },
    ],
  }),
  component: ProductsPage,
});

const statusStyles = {
  "in-stock": "bg-primary/12 text-primary",
  "low-stock": "bg-warning/12 text-warning",
  "out-of-stock": "bg-destructive/12 text-destructive",
} as const;

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Phones: Smartphone,
  Laptops: Laptop,
  Sound: Volume2,
  Accessories: Cable,
  Electronics: Cpu,
  Networking: Wifi,
  Cables: Cable,
  Gaming: Gamepad2,
  "Smart Home": House,
  Wearables: Watch,
  "Phone Screens": Tablet,
  "Phone Covers": Smartphone,
  "Kitchen Appliances": CookingPot,
  General: Box,
};

type Draft = {
  name: string;
  category: string;
  quantity: string;
  price: string;
  description: string;
};

const emptyDraft: Draft = { name: "", category: "", quantity: "", price: "", description: "" };

function ProductsPage() {
  const { products } = useAppState();
  const isAdmin = getCurrentUser()?.role === "admin";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saleDraft, setSaleDraft] = useState<{
    product: Product | null;
    quantity: string;
    price: string;
    payment: string;
  }>({ product: null, quantity: "1", price: "0", payment: "M-Pesa" });

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.spec.toLowerCase().includes(q);
        const matchC = category === "All" || p.category === category;
        return matchQ && matchC;
      }),
    [products, query, category],
  );

  const openAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      category: p.category,
      quantity: String(p.quantity),
      price: String(p.price),
      description: p.spec,
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!draft.name.trim() || !draft.category) return;
    const quantity = Number(draft.quantity) || 0;
    const price = Number(draft.price) || 0;

    if (editingId) {
      const product = products.find((entry) => entry.id === editingId);
      if (!product) return;
      actions.updateProduct(editingId, {
        name: draft.name.trim(),
        category: draft.category,
        quantity,
        price,
        spec: draft.description,
        updated: new Date().toISOString(),
      });
    } else {
      actions.addProduct({
        name: draft.name.trim(),
        category: draft.category,
        quantity,
        price,
        description: draft.description,
      });
    }
    setFormOpen(false);
  };

  const adjust = (id: string, delta: number) => {
    if (delta > 0) {
      actions.adjustStock(id, delta, "Stock Added");
      return;
    }
    actions.adjustStock(id, delta, "Stock Deducted");
  };

  const openSaleDialog = (product: Product) => {
    setSaleDraft({
      product,
      quantity: "1",
      price: String(product.price),
      payment: "M-Pesa",
    });
    setSaleDialogOpen(true);
  };

  const confirmSale = () => {
    if (!saleDraft.product) return;

    const qty = Number(saleDraft.quantity) || 1;
    const price = Number(saleDraft.price) || saleDraft.product.price;
    const clampedQty = Math.min(Math.max(qty, 1), saleDraft.product.quantity || 1);

    actions.addToCart({
      kind: "product",
      productId: saleDraft.product.id,
      name: saleDraft.product.name,
      qty: clampedQty,
      price,
      payment: saleDraft.payment,
      note: saleDraft.product.spec,
    });

    setSaleDialogOpen(false);
    setSaleDraft({ product: null, quantity: "1", price: "0", payment: "M-Pesa" });
  };

  const tiles = [
    { name: "All", label: "All Products", icon: LayoutGrid, count: products.length },
    ...categories.map((c) => ({
      name: c as string,
      label: c as string,
      icon: categoryIcons[c] ?? LayoutGrid,
      count: products.filter((p) => p.category === c).length,
    })),
  ];

  return (
    <DashboardShell
      title="Products"
      subtitle="Browse and manage product inventory"
      action={
        isAdmin ? (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary"
          >
            <Plus className="size-4" />
            Add Product
          </button>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {tiles.map(({ name, label, icon: Icon, count }) => (
          <button
            key={name}
            onClick={() => setCategory(name)}
            className={cn(
              "panel flex flex-col items-center gap-3 px-4 py-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40",
              category === name && "border-primary/60 glow-ring",
            )}
          >
            <span
              className={cn(
                "grid size-12 place-items-center rounded-full",
                category === name
                  ? "bg-primary/16 text-primary"
                  : "bg-surface-2 text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className={cn("text-sm font-semibold", category === name && "text-primary")}>
              {label}
            </span>
            <span className="text-xs text-muted-foreground">{count} Products</span>
          </button>
        ))}
      </div>

      <div className="panel mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="bg-surface-2 pl-9"
            />
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-glow glow-ring"
            >
              <Plus className="size-4" />
              Add Product
            </button>
          )}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-3 py-3 font-semibold">Product Name</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 text-right font-semibold">Quantity</th>
                <th className="px-3 py-3 text-right font-semibold">Selling Price</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Add Sale</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = statusOf(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border/70 transition-colors hover:bg-surface-2/70"
                  >
                    <td className="px-3 py-3.5">
                      <p className="font-medium">{p.name}</p>
                      {p.spec && <p className="text-xs text-muted-foreground">{p.spec}</p>}
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{p.category}</td>
                    <td className="px-3 py-3.5 text-right font-semibold">{p.quantity}</td>
                    <td className="px-3 py-3.5 text-right text-muted-foreground">
                      KES {p.price.toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          statusStyles[status],
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {statusLabels[status]}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <button
                        onClick={() => openSaleDialog(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <ShoppingCart className="size-3.5" /> Add
                      </button>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex justify-end">
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label={`Actions for ${p.name}`}
                                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/12 hover:text-primary"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-card">
                              <DropdownMenuItem onClick={() => openEdit(p)}>
                                <Pencil className="size-4" /> Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => adjust(p.id, 1)}>
                                <PackagePlus className="size-4" /> Add Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => adjust(p.id, -1)}>
                                <Minus className="size-4" /> Deduct Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => actions.deleteProduct(p.id)}
                              >
                                <Trash2 className="size-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                    No products yet. Use “Add Product” to create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-display text-xl">Add to Daily Sales</DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              {saleDraft.product?.name || "Product"}
            </p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale-qty">Quantity</Label>
                <Input
                  id="sale-qty"
                  type="number"
                  min="1"
                  max={saleDraft.product?.quantity ?? 1}
                  value={saleDraft.quantity}
                  onChange={(event) =>
                    setSaleDraft((draft) => ({ ...draft, quantity: event.target.value }))
                  }
                  className="bg-surface-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-price">Price per unit (KES)</Label>
                <Input
                  id="sale-price"
                  type="number"
                  min="0"
                  value={saleDraft.price}
                  onChange={(event) =>
                    setSaleDraft((draft) => ({ ...draft, price: event.target.value }))
                  }
                  className="bg-surface-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Available: {saleDraft.product?.quantity ?? 0}</span>
              <span>Listed: KES {Number(saleDraft.product?.price ?? 0).toLocaleString()}</span>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-center text-lg font-semibold text-foreground">
              Total: KES{" "}
              {(
                (Number(saleDraft.price) || 0) * (Number(saleDraft.quantity) || 0)
              ).toLocaleString()}
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "M-Pesa", label: "M-Pesa" },
                  { value: "Cash", label: "Cash" },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSaleDraft((draft) => ({ ...draft, payment: method.value }))}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      saleDraft.payment === method.value
                        ? "border-primary bg-primary/12 text-primary"
                        : "border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setSaleDialogOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={confirmSale}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                Add to Sales
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              Fill in the product details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Product Name *</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Enter product name"
                className="bg-surface-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
              >
                <SelectTrigger className="bg-surface-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-qty">Initial Quantity</Label>
                <Input
                  id="p-qty"
                  type="number"
                  value={draft.quantity}
                  onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
                  placeholder="0"
                  className="bg-surface-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Selling Price (KES)</Label>
                <Input
                  id="p-price"
                  type="number"
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  placeholder="0"
                  className="bg-surface-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Enter product description..."
                className="bg-surface-2"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
              >
                {editingId ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
