import type { CSSProperties } from "react";
import type { FruitKind } from "../data/flavours";

const PALETTE: Record<FruitKind, { rind: string; flesh: string; pith: string }> = {
  orange: { rind: "#FF8A1F", flesh: "#FFB347", pith: "#FFF1D6" },
  grapefruit: { rind: "#F0457F", flesh: "#FF8FB0", pith: "#FFE6EE" },
  lime: { rind: "#4FA316", flesh: "#B5E04D", pith: "#F3FBD6" },
  lemon: { rind: "#F4B800", flesh: "#FFE066", pith: "#FFF9D6" },
};

export function FruitSlice({
  kind = "orange",
  size = 120,
  className = "",
  style,
}: {
  kind?: FruitKind;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const p = PALETTE[kind];
  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <circle r="96" fill={p.rind} />
      <circle r="84" fill={p.pith} />
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          transform={`rotate(${i * 45})`}
          d="M10 -9 Q52 -40 74 -9 Q78 0 74 9 Q52 40 10 9 Z"
          fill={p.flesh}
        />
      ))}
      <circle r="7" fill={p.pith} />
    </svg>
  );
}

export function Bubble({ size = 24, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute rounded-full border-[3px] border-white/70 ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}
