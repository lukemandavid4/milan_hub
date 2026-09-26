import { useSyncExternalStore } from "react";
import type { Product } from "@/data/inventory";
import { apiRequest } from "@/lib/api";

export type PaymentMethod = "M-Pesa" | "Cash";

export const SHOP_NAME = "Milan Hub";

export type Service = {
  id: string;
  name: string;
  price: number;
  description: string;
  payment: PaymentMethod | string;
  at: string;
};

export type CartItem = {
  id: string;
  kind: "product" | "service";
  productId?: string | undefined;
  name: string;
  qty: number;
  price: number;
  payment: PaymentMethod | string;
  note?: string | undefined;
  at: string;
};

export type Sale = CartItem & { soldAt: string };

export type HistoryEntry = {
  id: string;
  kind: "product" | "service";
  name: string;
  action: string;
  qty: number;
  before: number;
  after: number;
  amount: number;
  note?: string;
  at: string;
};

export type AppState = {
  products: Product[];
  services: Service[];
  cart: CartItem[];
  sales: Sale[];
  history: HistoryEntry[];
};

const emptyState: AppState = { products: [], services: [], cart: [], sales: [], history: [] };

let state: AppState = emptyState;
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(next: Partial<AppState>) {
  state = { ...state, ...next };
  emit();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  hydrationPromise = apiRequest<{
    products: Product[];
    services: Service[];
    cart: CartItem[];
    sales: Sale[];
    history: HistoryEntry[];
  }>("/state").then((remote) => {
    if (!remote) return;
    state = { ...state, ...remote };
    emit();
  });
}

async function waitForHydration() {
  hydrate();
  await hydrationPromise;
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => emptyState,
  );
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function logHistory(entry: Omit<HistoryEntry, "id" | "at">) {
  const record = { ...entry, id: uid(), at: new Date().toISOString() };
  state = { ...state, history: [record, ...state.history] };
}

export const actions = {
  async addProduct(input: {
    name: string;
    category: string;
    quantity: number;
    price: number;
    description: string;
  }) {
    const id = uid();
    const product: Product = {
      id,
      sku: `MH-${id.slice(0, 6).toUpperCase()}`,
      name: input.name,
      spec: input.description,
      category: input.category,
      quantity: input.quantity,
      threshold: 3,
      price: input.price,
      updated: new Date().toISOString(),
    };
    const persisted = await apiRequest("/products", {
      method: "POST",
      body: JSON.stringify({ ...product, id }),
    });
    if (!persisted) return false;
    logHistory({
      kind: "product",
      name: product.name,
      action: "Created",
      qty: product.quantity,
      before: 0,
      after: product.quantity,
      amount: product.price,
    });
    set({ products: [product, ...state.products] });
    return persisted !== null;
  },

  async updateProduct(id: string, patch: Partial<Product>) {
    const previous = state.products.find((product) => product.id === id);
    const persisted = await apiRequest(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    if (!persisted) return false;
    if (previous && patch.quantity !== undefined && patch.quantity !== previous.quantity) {
      logHistory({
        kind: "product",
        name: patch.name || previous.name,
        action: "Stock Updated",
        qty: Math.abs(patch.quantity - previous.quantity),
        before: previous.quantity,
        after: patch.quantity,
        amount: 0,
      });
    }
    set({ products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    return true;
  },

  async deleteProduct(id: string) {
    const p = state.products.find((x) => x.id === id);
    const persisted = await apiRequest(`/products/${id}`, { method: "DELETE" });
    if (!persisted) return false;
    if (p) {
      logHistory({
        kind: "product",
        name: p.name,
        action: "Deleted",
        qty: p.quantity,
        before: p.quantity,
        after: 0,
        amount: 0,
      });
    }
    set({ products: state.products.filter((x) => x.id !== id) });
    return true;
  },

  async adjustStock(
    id: string,
    delta: number,
    action = delta > 0 ? "Stock Added" : "Stock Deducted",
  ) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return false;
    const after = Math.max(0, p.quantity + delta);
    const persisted = await apiRequest(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: after }),
    });
    if (!persisted) return false;
    logHistory({
      kind: "product",
      name: p.name,
      action,
      qty: Math.abs(after - p.quantity),
      before: p.quantity,
      after,
      amount: 0,
    });
    set({
      products: state.products.map((x) => (x.id === id ? { ...x, quantity: after } : x)),
    });
    return true;
  },

  async addToCart(item: {
    name: string;
    price: number;
    payment: string;
    productId?: string;
    kind: "product" | "service";
    note?: string;
    quantity?: number;
  }) {
    await waitForHydration();
    const quantity = Math.max(1, Math.floor(item.quantity ?? 1));
    const existing =
      item.kind === "product" && item.productId
        ? state.cart.find(
            (c) =>
              c.productId === item.productId && c.payment === item.payment && c.kind === "product",
          )
        : undefined;
    if (existing) {
      if (item.kind === "product") {
        const product = state.products.find((candidate) => candidate.id === item.productId);
        if (!product || product.quantity <= 0 || existing.qty + quantity > product.quantity)
          return false;
      }
      const cart = state.cart.map((c) =>
        c.id === existing.id ? { ...c, qty: c.qty + quantity } : c,
      );
      const saved = await apiRequest("/cart", { method: "PUT", body: JSON.stringify({ cart }) });
      if (saved) set({ cart });
      return saved !== null;
    }
    if (item.kind === "product") {
      const product = state.products.find((candidate) => candidate.id === item.productId);
      if (!product || product.quantity <= 0 || quantity > product.quantity) return false;
    }
    const cart = [
      {
        id: uid(),
        kind: item.kind,
        productId: item.productId,
        name: item.name,
        price: item.price,
        payment: item.payment,
        note: item.note,
        qty: quantity,
        at: new Date().toISOString(),
      },
      ...state.cart,
    ];
    const saved = await apiRequest("/cart", { method: "PUT", body: JSON.stringify({ cart }) });
    if (saved) set({ cart });
    return saved !== null;
  },

  async removeFromCart(id: string) {
    await waitForHydration();
    const cart = state.cart.filter((c) => c.id !== id);
    const saved = await apiRequest("/cart", { method: "PUT", body: JSON.stringify({ cart }) });
    if (saved) set({ cart });
    return saved !== null;
  },

  async checkout(deductStock = true) {
    await waitForHydration();
    if (state.cart.length === 0) return false;
    const items = state.cart;
    const persisted = await apiRequest<{ ok: boolean }>("/sales/checkout", {
      method: "POST",
      body: JSON.stringify({ items, deductStock }),
    });
    if (!persisted) return false;

      const remote = await apiRequest<AppState>("/state");
    if (remote) {
      set(remote);
      return true;
    }

    const soldAt = new Date().toISOString();
    let products = state.products;
    for (const item of items) {
      if (item.kind === "product" && item.productId) {
        const p = products.find((x) => x.id === item.productId);
        if (!p) continue;
        const after = Math.max(0, p.quantity - item.qty);
        products = products.map((x) => (x.id === p.id ? { ...x, quantity: after } : x));
      }
    }
    set({
      products,
      cart: [],
      sales: [...items.map((c) => ({ ...c, soldAt })), ...state.sales],
    });
    await apiRequest("/cart", { method: "PUT", body: JSON.stringify({ cart: [] }) });
    return true;
  },

  async addService(input: { name: string; price: number; description: string; payment: string }) {
    const service: Service = {
      id: uid(),
      name: input.name,
      price: input.price,
      description: input.description,
      payment: input.payment,
      at: new Date().toISOString(),
    };
    const persisted = await apiRequest("/services", {
      method: "POST",
      body: JSON.stringify({ ...service, id: service.id }),
    });
    if (!persisted) return false;
    set({ services: [service, ...state.services] });
    const cartSaved = await actions.addToCart({
      kind: "service",
      name: service.name,
      price: service.price,
      payment: service.payment,
      note: service.description,
    });
    return persisted !== null && cartSaved;
  },

  async deleteService(id: string) {
    const persisted = await apiRequest(`/services/${id}`, { method: "DELETE" });
    if (!persisted) return false;
    set({ services: state.services.filter((s) => s.id !== id) });
    return true;
  },
};

export function formatKES(value: number) {
  return `KES ${Math.round(value).toLocaleString()}`;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function monthLabel(key: string) {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? new Date().getFullYear();
  const m = parts[1] ?? 1;
  return new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1),
  );
}
