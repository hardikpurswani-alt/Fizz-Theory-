import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVOURS, type FlavourId } from "./data/flavours";
import { startSmoothScroll } from "./lib/scroll";
import { ensureFonts } from "./lib/labelTexture";
import { footerCan, heroCan, motion, pointer } from "./three/canState";
import { Hero } from "./components/Hero";
import { Footer } from "./components/Footer";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const CanScene = lazy(() => import("./three/CanScene"));

function detectWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** viewport-relative placement of a DOM slot, so layout drives the 3D can */
function slotPlacement(id: string, scrollAtMeasure: () => number) {
  const el = document.getElementById(id);
  if (!el) return { x: 0, y: 0, h: 0.6 };
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = r.left + r.width / 2;
  const cy = r.top + window.scrollY + r.height / 2 - scrollAtMeasure();
  return {
    x: (cx - vw / 2) / (vw / 2),
    y: (vh / 2 - cy) / (vh / 2),
    h: (r.height / vh) * 0.94,
  };
}

export default function App() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  motion.reduced = reduced;

  const [flavourId, setFlavourId] = useState<FlavourId>("orange");
  const [webgl, setWebgl] = useState(() => !reduced && detectWebGL());
  const [curtain, setCurtain] = useState(!reduced);
  const curtainRef = useRef<HTMLDivElement>(null);
  const flavourSwitchTimer = useRef<number | undefined>(undefined);
  const flavour = FLAVOURS.find((f) => f.id === flavourId)!;

  useEffect(() => () => window.clearTimeout(flavourSwitchTimer.current), []);

  const pick = useCallback(
    (id: FlavourId) => {
      if (id === flavourId) return;
      if (motion.reduced) {
        setFlavourId(id);
        return;
      }
      gsap.to(heroCan, {
        spin: "+=" + Math.PI * 2,
        duration: 1,
        ease: "power3.inOut",
        overwrite: false,
      });
      window.clearTimeout(flavourSwitchTimer.current);
      flavourSwitchTimer.current = window.setTimeout(
        () => setFlavourId(id),
        280,
      );
    },
    [flavourId],
  );

  // pointer parallax
  useEffect(() => {
    const on = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, []);

  // smooth scroll, page-load transition and scroll-driven can
  useLayoutEffect(() => {
    const stopSmooth = motion.reduced ? undefined : startSmoothScroll();
    const ctx = gsap.context(() => {
      const hero = () => slotPlacement("hero-can-slot", () => 0);
      const foot = () => {
        const f = document.getElementById("footer")!;
        const bottomDoc = f.getBoundingClientRect().bottom + window.scrollY;
        return slotPlacement(
          "footer-can-slot",
          () => bottomDoc - window.innerHeight,
        );
      };
      const footerH = () =>
        document.getElementById("footer")!.offsetHeight / window.innerHeight;

      const heroTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "#top",
          start: "top top",
          end: "bottom top",
          scrub: motion.reduced ? true : 0.8,
          invalidateOnRefresh: true,
        },
      });
      heroTl.fromTo(
        heroCan,
        {
          x: () => hero().x,
          y: () => hero().y,
          h: () => hero().h,
          rx: 0.12,
          ry: -0.45,
          rz: -0.38,
        },
        {
          y: () => hero().y + 2.9,
          x: () => hero().x,
          h: () => hero().h * (motion.reduced ? 1 : 1.1),
          rx: motion.reduced ? 0.12 : 0.3,
          ry: motion.reduced ? -0.45 : -0.45 + Math.PI * 2.5,
          rz: motion.reduced ? -0.38 : 0.2,
        },
      );

      const footTl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "#footer",
          start: "top bottom",
          end: "bottom bottom",
          scrub: motion.reduced ? true : 0.8,
          invalidateOnRefresh: true,
        },
      });
      footTl.fromTo(
        footerCan,
        {
          x: () => foot().x,
          y: () => foot().y - 2 * footerH() - 0.2,
          h: () => foot().h,
          rx: 0.1,
          ry: 0,
          rz: motion.reduced ? -0.1 : 0.5,
        },
        {
          y: () => foot().y,
          x: () => foot().x,
          h: () => foot().h,
          rx: 0.06,
          ry: motion.reduced ? 0 : Math.PI * 2 + 0.3,
          rz: -0.1,
        },
      );

      if (!motion.reduced) {
        // intro: curtain wipe, then the can drops in with a spin
        const tl = gsap.timeline();
        tl.fromTo(
          "[data-curtain-logo]",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        )
          .to(curtainRef.current, {
            yPercent: -100,
            duration: 0.9,
            ease: "power4.inOut",
            delay: 0.25,
          })
          .add(() => setCurtain(false));
        gsap.from(heroCan, {
          dy: 2.6,
          spin: -Math.PI * 2,
          duration: 1.8,
          ease: "power3.out",
          delay: 1.1,
        });
      }
    });

    const refresh = () => ScrollTrigger.refresh();
    ensureFonts(FLAVOURS, async () => {
      if (webgl) {
        const { refreshLabelTextures } = await import("./three/SodaCan");
        refreshLabelTextures();
      }
      refresh();
    });
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
      stopSmooth?.();
    };
  }, []);

  return (
    <>
      {curtain && (
        <div
          ref={curtainRef}
          className="fixed inset-0 z-[110] grid place-items-center bg-fizz"
          aria-hidden="true"
        >
          <div
            data-curtain-logo
            className="font-display text-6xl font-extrabold tracking-tight text-white md:text-8xl"
          >
            fizz<span className="text-[#FFE066]">theory</span>
          </div>
        </div>
      )}

      <div>
        <Hero flavour={flavour} onPick={pick} webgl={webgl} />
      </div>
      <Footer webgl={webgl} />

      {webgl && (
        <SceneBoundary onError={() => setWebgl(false)}>
          <Suspense fallback={null}>
            <CanScene flavour={flavour} />
          </Suspense>
        </SceneBoundary>
      )}
    </>
  );
}
