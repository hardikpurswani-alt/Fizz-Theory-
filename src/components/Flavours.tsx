import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_FLAVOURS, money } from "../data/flavours";
import { motion } from "../three/canState";
import { useCart } from "../state/cart";
import { FlatCan } from "./FlatCan";
import { FruitSlice } from "./Fruit";
import { BagIcon, PlusIcon } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

export function Flavours() {
  const root = useRef<HTMLElement>(null);
  const { add } = useCart();

  useLayoutEffect(() => {
    if (motion.reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-head]", {
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
      gsap.from("[data-card]", {
        y: 120,
        opacity: 0,
        rotate: (i) => (i - 1) * 5,
        duration: 1,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: "[data-cards]", start: "top 85%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="flavours" ref={root} className="px-3 py-20 md:px-6 md:py-32">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col justify-between gap-4 px-2 md:mb-14 md:flex-row md:items-end">
          <h2
            data-head
            className="font-display text-[clamp(2.6rem,6vw,5.6rem)] font-extrabold leading-[0.92] tracking-[-0.02em] text-blue"
          >
            Pick your
            <br />
            flavour.
          </h2>
          <p data-head className="max-w-sm text-lg font-bold leading-snug text-navy/80">
            Three bold flavours, one simple idea: real fruit and bright bubbles. Prices are sample content.
          </p>
        </div>

        <ul data-cards className="grid gap-4 md:grid-cols-3 md:gap-6">
          {HERO_FLAVOURS.map((f) => (
            <li key={f.id} data-card>
              <article
                id={`flavour-${f.id}`}
                className="group relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[2rem] p-6 transition duration-500 hover:-translate-y-2 md:rounded-[2.5rem] md:p-8"
                style={{ backgroundColor: f.card }}
              >
                <FruitSlice
                  kind={f.fruit}
                  size={220}
                  className="absolute -right-12 -top-12 transition duration-700 group-hover:rotate-45 group-hover:scale-110"
                />
                <button
                  onClick={() => add(f.id)}
                  aria-label={`Add ${f.name} to cart`}
                  className="relative z-10 grid h-14 w-14 place-items-center rounded-full bg-navy text-white shadow-lg transition hover:scale-110 hover:bg-blue active:scale-90"
                >
                  <BagIcon />
                  <PlusIcon className="absolute -right-1 -top-1 rounded-full bg-red p-1" width={22} height={22} />
                </button>

                <div className="relative z-10 flex flex-1 items-center justify-center py-6">
                  <FlatCan
                    flavour={f}
                    label={`${f.name} can`}
                    className="h-[270px] -rotate-6 transition duration-500 group-hover:-translate-y-3 group-hover:rotate-3 group-hover:scale-105 md:h-[300px]"
                  />
                </div>

                <div className="relative z-10">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-3xl font-extrabold leading-none text-navy">{f.name}</h3>
                    <span className="font-display text-2xl font-extrabold text-navy">{money(f.price)}</span>
                  </div>
                  <p className="mt-2 font-semibold leading-snug text-navy/75">{f.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {f.tags.map((t) => (
                      <li key={t} className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-navy">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
