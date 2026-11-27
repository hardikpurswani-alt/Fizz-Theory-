import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "../three/canState";
import { FruitSlice } from "./Fruit";
import { HeartIcon } from "./Icons";
import type { FruitKind } from "../data/flavours";

gsap.registerPlugin(ScrollTrigger);

const TILES: { handle: string; likes: string; bg: string; fruit: FruitKind; rot: number; caption: string }[] = [
  { handle: "@maya.sips", likes: "24.8k", bg: "linear-gradient(160deg,#FFB347,#FF6B4A)", fruit: "orange", rot: -6, caption: "Golden hour fizz" },
  { handle: "@jonah.cooks", likes: "18.2k", bg: "linear-gradient(160deg,#FF8FB0,#F0457F)", fruit: "grapefruit", rot: 4, caption: "Berry pop mocktail" },
  { handle: "@priya.runs", likes: "31.5k", bg: "linear-gradient(160deg,#B5E04D,#4FA316)", fruit: "lime", rot: -3, caption: "Post-run reset" },
  { handle: "@theo.makes", likes: "12.9k", bg: "linear-gradient(160deg,#6AA8FF,#2340E8)", fruit: "lemon", rot: 6, caption: "Rooftop test batch" },
];

export function Social() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (motion.reduced) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-tile]", {
        y: 140,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-tiles]", start: "top 88%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="community" ref={root} className="overflow-hidden px-3 pb-[32vh] pt-16 md:px-6 md:pb-[40vh] md:pt-28">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-12 px-2 text-center">
          <h2 className="font-display text-[clamp(2.6rem,6vw,5.6rem)] font-extrabold leading-[0.92] tracking-[-0.02em] text-blue">
            Join the fizz.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg font-bold text-navy/75">
            Tag <span className="text-red">#fizztheory</span> and get featured. Community posts below are visual samples.
          </p>
        </div>

        <ul data-tiles className="grid grid-cols-2 gap-3 px-1 md:grid-cols-4 md:gap-6">
          {TILES.map((t) => (
            <li key={t.handle} data-tile>
              <article
                aria-label={`${t.caption}, community post sample by ${t.handle}`}
                className="group relative aspect-[3/4.2] overflow-hidden rounded-[1.5rem] shadow-[0_24px_40px_-20px_rgba(11,27,94,0.5)] transition-transform duration-500 hover:!rotate-0 md:rounded-[2rem]"
                style={{ background: t.bg, rotate: `${t.rot}deg` }}
              >
                <FruitSlice kind={t.fruit} size={260} className="absolute -right-[20%] -top-[8%] w-[75%] h-auto transition duration-700 group-hover:rotate-90" />
                <FruitSlice kind={t.fruit} size={120} className="absolute -left-[10%] bottom-[18%] w-[38%] h-auto opacity-80" />
                <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center font-display text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold leading-[0.95] text-white drop-shadow-[0_2px_12px_rgba(11,27,94,0.3)]">
                  {t.caption}
                </span>
                <span aria-hidden="true" className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-white/25 px-3 py-2 text-xs font-extrabold text-white backdrop-blur-md md:text-sm">
                  <span className="truncate">{t.handle}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <HeartIcon width={16} height={16} /> {t.likes}
                  </span>
                </span>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
