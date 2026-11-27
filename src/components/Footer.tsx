import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MIX, money } from "../data/flavours";
import { motion } from "../three/canState";

import { scrollToTop } from "../lib/scroll";
import { FlatCan } from "./FlatCan";
import { PlusIcon } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

const COLUMNS: { title: string; links: { label: string; id?: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All flavours", id: "flavours" },
      { label: "Sunny Orange", id: "flavour-orange" },
      { label: "Berry Pop", id: "flavour-berry" },
      { label: "Lime Spark", id: "flavour-lime" },
    ],
  },
  {
    title: "Brand",
    links: [
      { label: "Our story", id: "story" },
      { label: "Ingredients", id: "ingredients" },
      { label: "Community", id: "community" },
    ],
  },
  {
    title: "Help",
    links: [{ label: "Shipping" }, { label: "Returns" }, { label: "Contact" }],
  },
];

export function Footer({ webgl }: { webgl: boolean }) {

  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (motion.reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-foot]", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 35%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer
      id="footer"
      ref={root}
      className="relative flex min-h-[100svh] flex-col overflow-hidden rounded-t-[2rem] bg-navy px-6 pb-6 pt-24 text-white md:rounded-t-[3rem] md:px-14 md:pt-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[6%] select-none text-center font-display text-[clamp(5rem,21vw,22rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-white/[0.07]"
      >
        Mix-Tangy
      </div>

      <p data-foot className="relative text-center text-sm font-extrabold uppercase tracking-[0.25em] text-[#FFD23F]">
        Limited drop
      </p>

      <div className="relative mt-2 grid flex-1 gap-4 md:mt-4 md:gap-8 md:grid-cols-[1fr_minmax(240px,30%)_1fr] md:items-center md:gap-6">
        <div data-foot className="order-2 md:order-1">
          <h2 className="font-display text-3xl font-extrabold leading-none md:text-6xl">
            Fizz <br className="hidden md:block" />
            Mix-Tangy
          </h2>
          <p className="mt-3 hidden max-w-xs font-semibold leading-snug text-white/75 md:block">{MIX.description}</p>
          <div className="mt-4 flex items-center gap-4 md:mt-5">
            <button
              onClick={() => {
                location.assign("/shop/mix");
              }}
              aria-label="Shop Fizz Mix-Tangy"
              className="grid h-16 w-16 place-items-center rounded-full bg-[#FFD23F] text-navy shadow-[0_0_0_8px_rgba(255,210,63,0.2)] transition hover:scale-110 hover:rotate-90 active:scale-90"
            >
              <PlusIcon width={30} height={30} strokeWidth={3} />
            </button>
            <div>
              <span className="block font-display text-4xl font-extrabold leading-none">{money(MIX.price)}</span>
              <span className="text-sm font-bold text-white/65">12 fl oz · sample price</span>
            </div>
          </div>
        </div>

        {/* 3D can lands here */}
        <div
          id="footer-can-slot"
          aria-hidden="true"
          className="order-1 mx-auto h-[34svh] min-h-[210px] w-full max-w-[300px] md:order-2 md:h-[62svh]"
        >
          {!webgl && <FlatCan flavour={MIX} className="mx-auto h-full" label="Fizz Mix-Tangy can" />}
        </div>

        <nav data-foot aria-label="Footer" className="order-3 grid grid-cols-3 gap-4 md:justify-self-end md:gap-8">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 font-display text-lg font-extrabold text-[#FFD23F]">{c.title}</h3>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.id?.startsWith("flavour-") ? "/shop/"+l.id.slice(8) : l.id==="flavours" ? "/shop" : l.id==="community" ? "/community" : l.id ? "/about" : "/contact"}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div
        data-foot
        className="relative mt-4 flex flex-col md:mt-8 items-center justify-between gap-4 border-t border-white/15 pt-5 sm:flex-row"
      >
        <p className="text-xs font-bold text-white/60">© 2026 Fizz Theory. Demo brand with sample content. Test storefront.</p>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToTop}
            className="ml-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-extrabold transition hover:bg-white hover:text-navy"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
