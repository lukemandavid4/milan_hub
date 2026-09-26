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
  LoaderCircle,
} from "lucide-react";
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
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCurrentRole } from "@/lib/session";

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
  const { products: items } = useAppState();
  const role = useCurrentRole();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [salePayment, setSalePayment] = useState<"M-Pesa" | "Cash">("M-Pesa");
  const [isAddingSale, setIsAddingSale] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.spec.toLowerCase().includes(q);
        const matchC = category === "All" || p.category === category;
        return matchQ && matchC;
      }),
    [items, query, category],
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

  const save = async () => {
    if (!draft.name.trim() || !draft.category) {
      toast.error("Product name and category are required");
      return;
    }
    const quantity = Number(draft.quantity) || 0;
    const price = Number(draft.price) || 0;
    if (editingId) {
      const persisted = await actions.updateProduct(editingId, {
        name: draft.name.trim(),
        category: draft.category,
        quantity,
        price,
        spec: draft.description,
      });
      if (!persisted) {
        toast.error("Product could not be saved to the database");
        return;
      }
      toast.success("Product updated");
    } else {
      const persisted = await actions.addProduct({
        name: draft.name.trim(),
        category: draft.category,
        quantity,
        price,
        description: draft.description,
      });
      toast[persisted ? "success" : "error"](
        persisted
          ? "Product saved to MongoDB"
          : "Product could not be saved to the database",
      );
      if (!persisted) return;
    }
    setFormOpen(false);
  };

  const adjust = async (id: string, delta: number) => {
    const persisted = await actions.adjustStock(id, delta);
    toast[persisted ? "success" : "error"](
      persisted ? "Stock updated" : "Stock could not be saved to the database",
    );
  };

  const addSale = async () => {
    if (!saleProduct || isAddingSale) return;
    setIsAddingSale(true);
    try {
      if (saleProduct.quantity <= 0) {
        toast.error("Out-of-stock products cannot be added to daily sales");
        return;
      }
      const requestedQuantity = Math.max(1, Number(saleQuantity) || 1);
      const quantity = Math.min(saleProduct.quantity, requestedQuantity);
      const saved = await actions.addToCart({
        kind: "product",
        name: saleProduct.name,
        price: saleProduct.price,
        payment: salePayment,
        productId: saleProduct.id,
        quantity,
      });
      if (!saved) {
        toast.error("Product is out of stock or the sales cart could not be saved");
        return;
      }
      setSaleProduct(null);
      setSaleQuantity("1");
    } finally {
      setIsAddingSale(false);
    }
  };

  const tiles = [
    { name: "All", label: "All Products", icon: LayoutGrid, count: items.length },
    ...categories.map((c) => ({
      name: c as string,
      label: c as string,
      icon: categoryIcons[c] ?? LayoutGrid,
      count: items.filter((p) => p.category === c).length,
    })),
  ];

  return (
    <DashboardShell
      title="Products"
      subtitle="Browse and manage product inventory"
      action={
        <button
          data-admin-only
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary"
        >
          <Plus className="size-4" />
          Add Product
        </button>
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

      <div className="panel mt-6 min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="bg-surface-2 pl-9"
            />
          </div>
          <button
            data-admin-only
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-glow glow-ring"
          >
            <Plus className="size-4" />
            Add Product
          </button>
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
                        disabled={p.quantity <= 0}
                        onClick={() => setSaleProduct(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border disabled:hover:text-muted-foreground"
                      >
                        <ShoppingCart className="size-3.5" /> {p.quantity <= 0 ? "Out of stock" : "Add"}
                      </button>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label={`Actions for ${p.name}`}
                              data-admin-only
                              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/12 hover:text-primary"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card">
                            {role === "Admin" && <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Pencil className="size-4" /> Edit Product
                            </DropdownMenuItem>}
                            {role === "Admin" && <DropdownMenuItem onClick={() => adjust(p.id, 1)}>
                              <PackagePlus className="size-4" /> Add Stock
                            </DropdownMenuItem>}
                            {role === "Admin" && <DropdownMenuItem onClick={() => adjust(p.id, -1)}>
                              <Minus className="size-4" /> Deduct Stock
                            </DropdownMenuItem>}
                            {role === "Admin" && <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={async () => {
                                const persisted = await actions.deleteProduct(p.id);
                                toast[persisted ? "success" : "error"](
                                  persisted
                                    ? "Product deleted"
                                    : "Product could not be deleted from the database",
                                );
                              }}
                            >
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <Dialog open={saleProduct !== null} onOpenChange={(open) => !open && setSaleProduct(null)}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Daily Sales</DialogTitle>
            <DialogDescription className="text-center">{saleProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sale-quantity">Quantity</Label>
                <Input
                  id="sale-quantity"
                  type="number"
                  min="1"
                  max={saleProduct && saleProduct.quantity > 0 ? saleProduct.quantity : undefined}
                  value={saleQuantity}
                  onChange={(event) => setSaleQuantity(event.target.value)}
                  className="bg-surface-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-price">Price per unit (KES)</Label>
                <Input
                  id="sale-price"
                  value={saleProduct?.price ?? 0}
                  readOnly
                  className="bg-surface-2"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {saleProduct?.quantity === 0
                  ? "Out of stock; cannot add to sale"
                  : `Available: ${saleProduct?.quantity ?? 0}`}
              </span>
              <span>Listed: KES {saleProduct?.price.toLocaleString() ?? 0}</span>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4 text-center text-lg font-bold">
              Total: KES{" "}
              {((saleProduct?.price ?? 0) * (Number(saleQuantity) || 0)).toLocaleString()}
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="mt-2 flex gap-2">
                {(["M-Pesa", "Cash"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSalePayment(method)}
                    className={cn(
                      "rounded-xl border px-5 py-2 text-sm",
                      salePayment === method
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSaleProduct(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addSale}
                disabled={!saleProduct || saleProduct.quantity <= 0 || isAddingSale}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAddingSale && <LoaderCircle className="size-4 animate-spin" />}
                {isAddingSale ? "Adding..." : "Add to Sales"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
