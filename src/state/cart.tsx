import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FLAVOURS, type Flavour, type FlavourId } from "../data/flavours";

interface CartCtx {
  items: { flavour: Flavour; qty: number }[];
  count: number;
  subtotal: number;
  open: boolean;
  toast: string | null;
  add: (id: FlavourId) => void;
  setQty: (id: FlavourId, qty: number) => void;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const CART_STORAGE_KEY = "fizz-theory-cart-v1";

function readCart(): Partial<Record<FlavourId, number>> {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([id, n]) => FLAVOURS.some((flavour) => flavour.id === id) && Number.isInteger(n) && (n as number) > 0)
        .map(([id, n]) => [id, Math.min(12, n as number)]),
    ) as Partial<Record<FlavourId, number>>;
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [qty, setQtyMap] = useState<Partial<Record<FlavourId, number>>>(readCart);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(qty));
    } catch {
      // Storage can be unavailable in private browsing; cart still works for this visit.
    }
  }, [qty]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) setQtyMap(readCart());
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  const add = useCallback((id: FlavourId) => {
    setQtyMap((q) => ({ ...q, [id]: Math.min(12, (q[id] ?? 0) + 1) }));
    const f = FLAVOURS.find((x) => x.id === id)!;
    setToast(`${f.name} added`);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  const setQty = useCallback((id: FlavourId, n: number) => {
    setQtyMap((q) => {
      const next = { ...q };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(12, n);
      return next;
    });
  }, []);

  const value = useMemo<CartCtx>(() => {
    const items = FLAVOURS.filter((f) => (qty[f.id] ?? 0) > 0).map((f) => ({ flavour: f, qty: qty[f.id]! }));
    return {
      items,
      count: items.reduce((a, i) => a + i.qty, 0),
      subtotal: items.reduce((a, i) => a + i.qty * i.flavour.price, 0),
      open,
      toast,
      add,
      setQty,
      setOpen,
    };
  }, [qty, open, toast, add, setQty]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
