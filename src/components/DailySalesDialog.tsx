import { useState } from "react";
import { Clock, CreditCard, ShoppingCart, Store, CheckCircle2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { actions, formatKES, formatTime, SHOP_NAME, useAppState } from "@/lib/store";

export function DailySalesDialog() {
  const [open, setOpen] = useState(false);
  const { cart } = useAppState();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-glow glow-ring">
          <ShoppingCart className="size-4" />
          Daily Sales
          {count > 0 && (
            <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-md">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">{SHOP_NAME} Sales</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Items sold at {SHOP_NAME}. Deduct stock when ready.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {cart.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-surface-2/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.kind === "service" ? `[Service] ${item.name}` : item.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {formatTime(item.at)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <CreditCard className="size-3.5" /> {item.payment}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {formatKES(item.price * item.qty)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    x{item.qty}
                  </span>
                  <button
                    aria-label={`Remove ${item.name}`}
                    onClick={() => actions.removeFromCart(item.id)}
                    className="grid size-7 place-items-center rounded-md text-destructive transition-colors hover:bg-destructive/12"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <ShoppingCart className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No items yet. Add products or services to today's sales.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Shop Total ({count} items)</p>
            <p className="text-lg font-bold text-primary">{formatKES(total)}</p>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => {
              actions.checkout();
              setOpen(false);
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            Deduct {SHOP_NAME} Stock
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
