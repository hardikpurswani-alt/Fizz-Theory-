import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { HERO_FLAVOURS, type Flavour, type FlavourId } from "../data/flavours";
import { motion } from "../three/canState";

import { ArrowIcon } from "./Icons";
import { Bubble, FruitSlice } from "./Fruit";
import { FlatCan } from "./FlatCan";

export function Hero({
  flavour,
  onPick,
  webgl,
}: {
  flavour: Flavour;
  onPick: (id: FlavourId) => void;
  webgl: boolean;
}) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (motion.reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-in]", {
        y: 70,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.09,
        delay: 0.9,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={root}
      className="relative mx-3 mt-3 h-[calc(100svh-24px)] min-h-[680px] overflow-hidden rounded-[2rem] transition-colors duration-700 md:rounded-[2.75rem]"
      style={{ backgroundColor: flavour.hero }}
      aria-label="Fizz Theory hero"
    >
      {/* glow behind can */}
      <div
        aria-hidden="true"
        className="absolute right-[-10%] top-[-10%] h-[120%] w-[70%] rounded-full opacity-60 blur-3xl transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${flavour.accent} 0%, transparent 65%)` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_100%,rgba(0,0,0,0.18),transparent_60%)]" />

      {/* floating fruit */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <FruitSlice kind={flavour.fruit} size={150} className="float-a absolute right-[4%] top-[16%] hidden md:block" style={{ ["--r" as string]: "12deg" }} />
        <FruitSlice kind={flavour.fruit} size={96} className="float-b absolute right-[43%] bottom-[12%] hidden md:block" style={{ ["--r" as string]: "-20deg" }} />
        <FruitSlice kind={flavour.fruit} size={70} className="float-b absolute right-[6%] top-[27%] md:hidden" style={{ ["--r" as string]: "10deg" }} />
        <FruitSlice kind={flavour.fruit} size={56} className="float-a absolute left-[6%] top-[46%] md:hidden" style={{ ["--r" as string]: "-10deg" }} />
        <Bubble size={28} className="float-a left-[48%] top-[24%]" />
        <Bubble size={16} className="float-b left-[55%] top-[60%]" />
        <Bubble size={40} className="float-b right-[18%] bottom-[22%]" />
        <Bubble size={20} className="float-a right-[30%] top-[14%]" />
      </div>

      {/* 3D can lives in the fixed WebGL canvas and is aligned to this slot */}
      <div
        id="hero-can-slot"
        aria-hidden="true"
        className="absolute inset-x-0 top-[47%] bottom-[19%] md:inset-x-auto md:bottom-[27%] md:right-[11%] md:top-[9%] md:w-[30%]"
      >
        {!webgl && (
          <FlatCan flavour={flavour} className="mx-auto h-full -rotate-[20deg]" label={`${flavour.name} can`} />
        )}
      </div>

      <div className="relative z-10 flex h-full flex-col px-6 pb-6 pt-28 md:px-14 md:pb-10 md:pt-36">
        <div>
          <h1
            data-hero-in
            className="max-w-[9ch] font-display text-[clamp(3.2rem,10.5vw,10.5rem)] md:max-w-none font-extrabold leading-[0.84] tracking-[-0.03em] text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.12)]"
          >
            Refresh more.
            <br />
            <span className="text-[#FFF4B8]">Feel better.</span>
          </h1>
          <p data-hero-in className="mt-5 hidden max-w-[28rem] md:block text-[1.05rem] font-semibold leading-snug text-white/90 md:mt-7 md:text-xl">
            Sparkling soda made with real fruit extracts. Bold flavour, bright bubbles, zero fuss.
          </p>
          <div data-hero-in className="mt-5 flex items-center gap-2 md:mt-6 md:gap-3">
            <button
              onClick={() => location.assign("/shop")}
              className="group flex items-center gap-2 whitespace-nowrap rounded-full bg-white max-[360px]:!px-4 max-[360px]:!text-[0.85rem] px-5 py-3 text-[0.95rem] font-extrabold text-navy md:px-6 md:py-3.5 md:text-base shadow-[0_10px_0_-4px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#FFF4B8] active:translate-y-0.5 active:shadow-none"
            >
              Shop flavours
              <ArrowIcon className="transition group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => location.assign("/about")}
              className="whitespace-nowrap rounded-full border-2 border-white/70 max-[360px]:!px-4 max-[360px]:!text-[0.85rem] px-5 py-2.5 text-[0.95rem] font-extrabold text-white md:px-6 md:py-3 md:text-base transition hover:bg-white/15"
            >
              Our story
            </button>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-6">
          <div data-hero-in>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-white/85">Pick a flavour</p>
            <div role="group" aria-label="Choose a flavour" className="flex gap-2.5">
              {HERO_FLAVOURS.map((f) => {
                const on = f.id === flavour.id;
                return (
                  <button
                    key={f.id}
                    aria-pressed={on}
                    aria-label={f.name}
                    onClick={() => onPick(f.id)}
                    className={`relative grid h-[4.5rem] w-[4.5rem] place-items-center overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 md:h-20 md:w-20 ${
                      on ? "scale-105 bg-white shadow-xl ring-4 ring-white/80" : "bg-white/30 backdrop-blur"
                    }`}
                    style={on ? undefined : undefined}
                  >
                    <FlatCan flavour={f} className="h-[88%] rotate-[14deg]" />
                  </button>
                );
              })}
            </div>
          </div>

          <a href={`/shop/${flavour.id}`} className="hidden rounded-3xl bg-navy px-6 py-4 font-display text-2xl font-bold text-white md:block">{flavour.name} ↗</a>
        </div>
      </div>
    </section>
  );
}
