export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type Product = {
  id: string;
  sku: string;
  name: string;
  spec: string;
  category: string;
  quantity: number;
  threshold: number;
  price: number;
  updated: string;
};

export const categories = [
  "Electronics",
  "Phones",
  "Laptops",
  "Sound",
  "Accessories",
  "Cables",
  "Gaming",
  "Smart Home",
  "Wearables",
  "Networking",
  "Phone Screens",
  "Phone Covers",
  "Kitchen Appliances",
  "General",
] as const;

export const products: Product[] = [];

export function statusOf(p: Product): StockStatus {
  if (p.quantity === 0) return "out-of-stock";
  if (p.quantity <= p.threshold) return "low-stock";
  return "in-stock";
}

export const statusLabels: Record<StockStatus, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

export const categoryStock = categories.map((category) => ({
  category,
  units: products
    .filter((p) => p.category === category)
    .reduce((sum, p) => sum + p.quantity, 0),
}));

export const totals = {
  units: products.reduce((s, p) => s + p.quantity, 0),
  skus: products.length,
  low: products.filter((p) => statusOf(p) === "low-stock").length,
  out: products.filter((p) => statusOf(p) === "out-of-stock").length,
};

export type ActivityKind = "restock" | "low" | "out" | "sale";

export const activity: {
  id: string;
  kind: ActivityKind;
  name: string;
  spec: string;
  tag: string;
  time: string;
}[] = [];
