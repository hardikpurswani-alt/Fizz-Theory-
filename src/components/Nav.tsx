import { useEffect, useRef, useState } from "react";
import { scrollToId, scrollToTop } from "../lib/scroll";
import { useCart } from "../state/cart";
import type { Flavour } from "../data/flavours";
import { BagIcon, CloseIcon, MenuIcon } from "./Icons";

const LINKS = [
  { id: "story", label: "Our story" },
  { id: "ingredients", label: "Ingredients" },
  { id: "flavours", label: "Flavours" },
  { id: "community", label: "Community" },
];

export function Nav({ flavour }: { flavour: Flavour }) {
  const { count, add, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menu]);

  const go = (id: string) => {
    if (menu) {
      setMenu(false);
      menuButton.current?.focus();
    }
    scrollToId(id);
  };

  const solid = scrolled || menu;

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-5 pt-5 md:px-9">
      <nav
        aria-label="Primary"
        className={`mx-auto flex max-w-[1500px] items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 md:px-6 ${
          solid
            ? "bg-cream/90 text-navy shadow-[0_8px_30px_-10px_rgba(11,27,94,0.35)] backdrop-blur-md"
            : "bg-transparent text-white"
        }`}
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setMenu(false);
            scrollToTop();
          }}
          className="font-display text-[1.7rem] font-extrabold leading-none tracking-tight"
          aria-label="Fizz Theory, back to top"
        >
          fizz<span className={solid ? "text-fizz" : "text-[#FFE066]"}>theory</span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => go(l.id)}
                className="rounded-full px-4 py-2 text-[0.95rem] font-bold transition hover:bg-current/10"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              add(flavour.id);
              setOpen(true);
            }}
            className={`group flex items-center gap-2 rounded-full px-4 py-2.5 max-[380px]:hidden text-[0.95rem] font-extrabold transition active:scale-95 ${
              solid ? "bg-navy text-white hover:bg-blue" : "bg-white text-navy hover:bg-[#FFF0C2]"
            }`}
          >
            <span className="hidden sm:inline">Add to cart</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={() => setOpen(true)}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            className={`relative grid h-11 w-11 place-items-center rounded-full border-2 transition hover:scale-105 active:scale-95 ${
              solid ? "border-navy/20" : "border-white/60"
            }`}
          >
            <BagIcon />
            {count > 0 && (
              <span
                key={count}
                className="pop absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red px-1 text-[0.7rem] font-extrabold text-white"
              >
                {count}
              </span>
            )}
          </button>
          <button
            ref={menuButton}
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-full md:hidden"
          >
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {menu && (
        <div
          id="mobile-menu"
          className="pop mx-auto mt-2 max-w-[1500px] rounded-3xl bg-cream/95 p-3 text-navy shadow-xl backdrop-blur-md md:hidden"
        >
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="block w-full rounded-2xl px-4 py-3.5 text-left font-display text-2xl font-bold hover:bg-white"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
