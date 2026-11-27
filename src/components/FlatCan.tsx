import { useEffect, useState } from "react";
import type { Flavour } from "../data/flavours";
import { ensureFonts, getFrontUrl } from "../lib/labelTexture";
import { FLAVOURS } from "../data/flavours";

let fontsDone = false;
const listeners = new Set<() => void>();
function onFonts(cb: () => void) {
  listeners.add(cb);
  if (!fontsDone && listeners.size === 1) {
    ensureFonts(FLAVOURS, () => {
      fontsDone = true;
      listeners.forEach((l) => l());
    });
  }
  return () => {
    listeners.delete(cb);
  };
}

/** Flat 2D can (cards, thumbnails, WebGL fallback). The hero can is real 3D. */
export function FlatCan({ flavour, className = "", label }: { flavour: Flavour; className?: string; label?: string }) {
  const [url, setUrl] = useState(() => getFrontUrl(flavour));
  useEffect(() => {
    setUrl(getFrontUrl(flavour));
    return onFonts(() => setUrl(getFrontUrl(flavour)));
  }, [flavour]);

  return (
    <div className={`relative aspect-[620/1000] ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <div className="absolute inset-x-[3%] top-0 h-[5%] rounded-[50%] bg-gradient-to-b from-white to-zinc-300 shadow-inner" />
      <div
        className="absolute inset-x-0 top-[2.2%] bottom-[2.2%] overflow-hidden rounded-[10%/4%] bg-cover bg-center shadow-[0_18px_30px_-12px_rgba(0,0,0,0.35)]"
        style={{ backgroundImage: `url(${url})`, backgroundSize: "100% 100%" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0)_22%,rgba(255,255,255,0.28)_34%,rgba(255,255,255,0)_44%,rgba(0,0,0,0)_70%,rgba(0,0,0,0.4)_100%)]" />
      </div>
      <div className="absolute inset-x-[2%] bottom-0 h-[4%] rounded-[50%] bg-gradient-to-b from-zinc-300 to-zinc-500" />
    </div>
  );
}
