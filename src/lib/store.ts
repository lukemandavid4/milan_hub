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

const STORAGE_KEY = "milanhub-state-v1";

const emptyState: AppState = { products: [], services: [], cart: [], sales: [], history: [] };

let state: AppState = emptyState;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function set(next: Partial<AppState>) {
  state = { ...state, ...next };
  persist();
  emit();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  void apiRequest<{
    products: Product[];
    services: Service[];
    sales: Sale[];
    history: HistoryEntry[];
  }>("/state").then((remote) => {
    if (!remote) return;
    state = { ...state, ...remote };
    emit();
  });
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
  state = {
    ...state,
    history: [{ ...entry, id: uid(), at: new Date().toISOString() }, ...state.history],
  };
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

  updateProduct(id: string, patch: Partial<Product>) {
    void apiRequest(`/products/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    set({ products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  deleteProduct(id: string) {
    const p = state.products.find((x) => x.id === id);
    if (p) {
      void apiRequest(`/products/${id}`, { method: "DELETE" });
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
  },

  adjustStock(id: string, delta: number, action = delta > 0 ? "Stock Added" : "Stock Deducted") {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    const after = Math.max(0, p.quantity + delta);
    void apiRequest(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: after }),
    });
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
  },

  addToCart(item: {
    name: string;
    price: number;
    payment: string;
    productId?: string;
    kind: "product" | "service";
    note?: string;
  }) {
    const existing =
      item.kind === "product" && item.productId
        ? state.cart.find(
            (c) =>
              c.productId === item.productId && c.payment === item.payment && c.kind === "product",
          )
        : undefined;
    if (existing) {
      set({
        cart: state.cart.map((c) => (c.id === existing.id ? { ...c, qty: c.qty + 1 } : c)),
      });
      return;
    }
    set({
      cart: [
        {
          id: uid(),
          kind: item.kind,
          productId: item.productId,
          name: item.name,
          price: item.price,
          payment: item.payment,
          note: item.note,
          qty: 1,
          at: new Date().toISOString(),
        },
        ...state.cart,
      ],
    });
  },

  removeFromCart(id: string) {
    set({ cart: state.cart.filter((c) => c.id !== id) });
  },

  checkout() {
    if (state.cart.length === 0) return;
    const soldAt = new Date().toISOString();
    void apiRequest("/sales/checkout", {
      method: "POST",
      body: JSON.stringify({ items: state.cart }),
    });
    let products = state.products;
    for (const item of state.cart) {
      if (item.kind === "product" && item.productId) {
        const p = products.find((x) => x.id === item.productId);
        if (!p) continue;
        const after = Math.max(0, p.quantity - item.qty);
        logHistory({
          kind: "product",
          name: p.name,
          action: "Sold",
          qty: item.qty,
          before: p.quantity,
          after,
          amount: item.price * item.qty,
          note: item.payment,
        });
        products = products.map((x) => (x.id === p.id ? { ...x, quantity: after } : x));
      } else {
        logHistory({
          kind: "service",
          name: item.name,
          action: "Service",
          qty: item.qty,
          before: 0,
          after: 0,
          amount: item.price * item.qty,
          note: item.payment,
        });
      }
    }
    set({
      products,
      cart: [],
      sales: [...state.cart.map((c) => ({ ...c, soldAt })), ...state.sales],
    });
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
    set({ services: [service, ...state.services] });
    actions.addToCart({
      kind: "service",
      name: service.name,
      price: service.price,
      payment: service.payment,
      note: service.description,
    });
    return persisted !== null;
  },

  deleteService(id: string) {
    set({ services: state.services.filter((s) => s.id !== id) });
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
