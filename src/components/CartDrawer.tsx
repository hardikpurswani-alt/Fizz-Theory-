import { useEffect, useRef } from "react";
import { money } from "../data/flavours";
import { resumeScroll, stopScroll } from "../lib/scroll";
import { useCart } from "../state/cart";
import { FlatCan } from "./FlatCan";
import { BagIcon, CloseIcon, MinusIcon, PlusIcon } from "./Icons";

export function CartDrawer() {
  const { open, setOpen, items, subtotal, count, setQty, toast } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef("");

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    previousOverflow.current = document.body.style.overflow;
    stopScroll();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow.current;
      resumeScroll();
      lastFocus.current?.focus?.();
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-navy/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!open}
        inert={!open}
        data-lenis-prevent
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-cream text-navy shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 p-5">
          <h2 className="font-display text-3xl font-extrabold">Your cart ({count})</h2>
          <button
            ref={closeRef}
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="grid h-11 w-11 place-items-center rounded-full bg-navy/10 transition hover:bg-navy hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-peach">
                  <BagIcon width={32} height={32} />
                </div>
                <p className="font-display text-2xl font-extrabold">Nothing here yet</p>
                <p className="mt-1 font-semibold text-navy/65">Add a flavour and it will show up here.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(({ flavour: f, qty }) => (
                <li key={f.id} className="flex items-center gap-4 rounded-3xl p-3" style={{ background: f.card }}>
                  <div className="grid h-24 w-20 shrink-0 place-items-center rounded-2xl bg-white/60">
                    <FlatCan flavour={f} className="h-[84px] rotate-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xl font-extrabold leading-tight">{f.name}</p>
                    <p className="text-sm font-bold text-navy/70">{money(f.price)} each</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        aria-label={`Decrease ${f.name}`}
                        onClick={() => setQty(f.id, qty - 1)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MinusIcon width={16} height={16} />
                      </button>
                      <span className="w-6 text-center font-extrabold" aria-live="polite">
                        {qty}
                      </span>
                      <button
                        aria-label={`Increase ${f.name}`}
                        onClick={() => setQty(f.id, qty + 1)}
                        disabled={qty >= 12}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <PlusIcon width={16} height={16} />
                      </button>
                      <button
                        onClick={() => setQty(f.id, 0)}
                        className="ml-auto text-sm font-bold underline-offset-2 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-navy/10 p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-bold">Subtotal</span>
            <span className="font-display text-3xl font-extrabold">{money(subtotal)}</span>
          </div>
          <button
            disabled
            className="w-full cursor-not-allowed rounded-full bg-navy/25 py-4 text-lg font-extrabold text-navy/60"
          >
            Checkout unavailable
          </button>
          <p className="mt-2 text-center text-xs font-bold text-navy/60">
            This is a demo storefront. No payment is taken and no order is placed.
          </p>
        </div>
      </aside>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-navy px-5 py-3 text-sm font-extrabold text-white shadow-xl transition-all duration-300 ${
          toast && !open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {toast}
      </div>
    </>
  );
}
