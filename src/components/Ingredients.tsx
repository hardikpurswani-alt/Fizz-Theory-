import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "../three/canState";
import { Bubble, FruitSlice } from "./Fruit";
import { LeafIcon } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

const CHIPS = [
  { t: "Real fruit extracts", d: "Pressed, not flavoured", c: "#FFB347" },
  { t: "Low sugar", d: "Just a touch of cane", c: "#FF8FB0" },
  { t: "Plant fibre", d: "Sample claim", c: "#B5E04D" },
  { t: "Zero artificial", d: "No dyes. No sweeteners", c: "#FFE066" },
];

export function Ingredients() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (motion.reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-ing]", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.fromTo(
        "[data-ing-art]",
        { scale: 0.88, rotate: -4 },
        {
          scale: 1,
          rotate: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "center 55%", scrub: true },
        },
      );
      gsap.to("[data-spin]", {
        rotate: 180,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="ingredients" ref={root} className="px-3 py-6 md:px-6">
      <div className="mx-auto grid max-w-[1500px] items-center gap-10 overflow-hidden rounded-[2rem] bg-sky p-7 md:grid-cols-2 md:gap-14 md:rounded-[2.75rem] md:p-16">
        <div>
          <p
            data-ing
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-blue"
          >
            <LeafIcon width={18} height={18} /> 100% real fruit extracts
          </p>
          <h2
            data-ing
            className="font-display text-[clamp(2.4rem,5.4vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-navy"
          >
            Real fruit.
            <br />
            Real fizz.
            <br />
            <span className="text-blue">Nothing to hide.</span>
          </h2>
          <p data-ing className="mt-5 max-w-md text-lg font-semibold leading-snug text-navy/80">
            We start with whole fruit, add sparkling water and stop there. Ingredient claims on this page are sample
            content for the demo.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {CHIPS.map((c) => (
              <li key={c.t} data-ing>
                <div className="flex h-full items-center gap-3 rounded-2xl bg-white/80 p-3.5 transition hover:-translate-y-1 hover:bg-white">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: c.c }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B1B5E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <span className="leading-tight">
                  <span className="block font-extrabold">{c.t}</span>
                  <span className="text-sm font-semibold text-navy/65">{c.d}</span>
                </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* illustrated fruit composition */}
        <div
          data-ing-art
          aria-hidden="true"
          className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#FFB347_0%,#FF6B4A_55%,#F0457F_100%)]"
        >
          <div data-spin className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2">
            <svg viewBox="-100 -100 200 200" className="h-full w-full opacity-25">
              {Array.from({ length: 12 }).map((_, i) => (
                <path key={i} transform={`rotate(${i * 30})`} d="M0 0 L100 -14 L100 14 Z" fill="#FFF4B8" />
              ))}
            </svg>
          </div>
          <FruitSlice kind="orange" size={340} className="float-a absolute -left-[8%] top-[6%] w-[62%] h-auto" style={{ ["--r" as string]: "-8deg" }} />
          <FruitSlice kind="grapefruit" size={220} className="float-b absolute -right-[6%] bottom-[2%] w-[48%] h-auto" style={{ ["--r" as string]: "14deg" }} />
          <FruitSlice kind="lime" size={140} className="float-a absolute right-[10%] top-[8%] w-[26%] h-auto" style={{ ["--r" as string]: "20deg" }} />
          <FruitSlice kind="lemon" size={120} className="float-b absolute bottom-[8%] left-[14%] w-[22%] h-auto" style={{ ["--r" as string]: "-18deg" }} />
          <Bubble size={36} className="left-[56%] top-[44%]" />
          <Bubble size={20} className="left-[34%] top-[64%]" />
          <Bubble size={52} className="left-[70%] top-[28%]" />
          <Bubble size={14} className="left-[48%] top-[18%]" />
        </div>
      </div>
    </section>
  );
}
