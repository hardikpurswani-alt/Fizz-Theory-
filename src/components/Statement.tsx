import { Fragment, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "../three/canState";
import { Bubble, FruitSlice } from "./Fruit";

gsap.registerPlugin(ScrollTrigger);

type Seg = { t: string; c?: "red" | "orange" };
const TEXT: Seg[] = [
  { t: "Fizz Theory is sparkling soda made with " },
  { t: "real fruit", c: "red" },
  { t: " extracts, a little " },
  { t: "sunshine", c: "orange" },
  { t: " and zero fuss. Crisp bubbles, bold flavour and " },
  { t: "nothing artificial", c: "red" },
  { t: " — just the " },
  { t: "good stuff", c: "orange" },
  { t: " you'll want another sip of." },
];

export function Statement() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!motion.reduced) {
        gsap.fromTo(
          ".st-word",
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: "#story-text", start: "top 82%", end: "bottom 55%", scrub: 0.6 },
          },
        );
        gsap.utils.toArray<HTMLElement>("[data-par]").forEach((el) => {
          gsap.to(el, {
            yPercent: Number(el.dataset.par),
            rotate: Number(el.dataset.rot ?? 0),
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="story" ref={root} className="relative overflow-hidden px-6 py-28 md:py-44">
      {/* tagline marquee */}
      <div className="absolute inset-x-0 top-4 overflow-hidden whitespace-nowrap" aria-hidden="true">
        <div className="marquee flex w-max font-display text-[clamp(1.4rem,3vw,2.2rem)] font-extrabold uppercase tracking-wide text-fizz/70">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="flex items-center">
                  Not your ordinary soda
                  <FruitSlice kind={i % 2 ? "lime" : "orange"} size={34} className="mx-6" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true">
        <FruitSlice kind="orange" size={130} className="absolute left-[3%] top-[18%] hidden md:block" />
        <FruitSlice kind="lime" size={90} className="absolute right-[6%] top-[14%] hidden md:block" />
        <FruitSlice kind="grapefruit" size={110} className="absolute bottom-[12%] left-[10%] hidden md:block" />
        <FruitSlice kind="lemon" size={140} className="absolute bottom-[10%] right-[4%] hidden md:block" />
        <div data-par="-40" data-rot="30" className="absolute left-[8%] top-[10%] md:left-[4%]">
          <FruitSlice kind="orange" size={64} className="md:hidden" />
        </div>
        <div data-par="-25" data-rot="-30" className="absolute bottom-[6%] right-[8%]">
          <FruitSlice kind="lime" size={56} className="md:hidden" />
        </div>
        <Bubble size={30} className="left-[22%] top-[30%] !border-blue/30" />
        <Bubble size={18} className="right-[24%] top-[26%] !border-blue/30" />
        <Bubble size={44} className="bottom-[22%] right-[28%] !border-blue/30" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <p className="mb-6 inline-block rounded-full bg-white/70 px-4 py-1.5 text-sm font-extrabold uppercase tracking-widest text-blue">
          What is Fizz Theory?
        </p>
        <p
          id="story-text"
          className="font-display text-[clamp(1.9rem,4.8vw,4.4rem)] font-bold leading-[1.08] tracking-[-0.015em] text-blue"
        >
          {TEXT.map((s, i) => (
            <Fragment key={i}>
              {s.t.split(/(\s+)/).map((w, j) =>
                /^\s+$/.test(w) || w === "" ? (
                  w
                ) : (
                  <span
                    key={j}
                    className={`st-word inline-block ${s.c === "red" ? "text-red" : s.c === "orange" ? "text-fizz" : ""}`}
                  >
                    {w}
                  </span>
                ),
              )}
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
