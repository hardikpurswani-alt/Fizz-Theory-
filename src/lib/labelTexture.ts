import type { Flavour } from "../data/flavours";

export const LABEL_W = 2048;
export const LABEL_H = 980;

const FONT = `"Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif`;
const RAINBOW = ["#FF3B30", "#FF8A1F", "#FFD23F", "#5DB11F", "#2D8CFF", "#7A4BFF"];

type Ctx = CanvasRenderingContext2D;

function slice(ctx: Ctx, cx: number, cy: number, r: number, rind: string, flesh: string, pith = "#FFF6DD") {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = rind;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pith;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flesh;
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i / 8) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(r * 0.1, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.42, r * 0.78, -r * 0.1);
    ctx.quadraticCurveTo(r * 0.82, 0, r * 0.78, r * 0.1);
    ctx.quadraticCurveTo(r * 0.55, r * 0.42, r * 0.1, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function bubbles(ctx: Ctx, cx: number, cy: number, w: number, h: number, n: number, seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 6;
  for (let i = 0; i < n; i++) {
    const x = cx + (rnd() - 0.5) * w;
    const y = cy + (rnd() - 0.5) * h;
    const r = 10 + rnd() * 34;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function wave(ctx: Ctx, y: number, amp: number, cycles: number, thick: number, color: string, phase = 0) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= LABEL_W; x += 16) {
    ctx.lineTo(x, y + Math.sin((x / LABEL_W) * Math.PI * 2 * cycles + phase) * amp);
  }
  for (let x = LABEL_W; x >= 0; x -= 16) {
    ctx.lineTo(x, y + thick + Math.sin((x / LABEL_W) * Math.PI * 2 * cycles + phase) * amp);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function sun(ctx: Ctx, cx: number, cy: number, r: number, color: string, ray: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = ray;
  for (let i = 0; i < 16; i++) {
    ctx.save();
    ctx.rotate((i / 16) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(r * 1.1, -r * 0.1);
    ctx.lineTo(r * 1.75, 0);
    ctx.lineTo(r * 1.1, r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pill(ctx: Ctx, cx: number, cy: number, text: string, bg: string, fg: string, size: number) {
  ctx.save();
  ctx.font = `800 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size * 1.4;
  const h = size * 1.6;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + size * 0.06);
  ctx.restore();
}

function backPanel(ctx: Ctx, cx: number, f: Flavour) {
  ctx.save();
  ctx.fillStyle = "#FFF8EE";
  ctx.beginPath();
  ctx.roundRect(cx - 250, 170, 500, 640, 36);
  ctx.fill();
  ctx.fillStyle = "#0B1B5E";
  ctx.textAlign = "center";
  ctx.font = `800 46px ${FONT}`;
  ctx.fillText("SAMPLE FACTS", cx, 240);
  ctx.font = `700 30px ${FONT}`;
  const rows = [
    "Sparkling water",
    f.id === "mix" ? "Mixed fruit extracts" : "Real fruit extracts",
    "Cane sugar (a little)",
    "Citric acid",
    "Natural flavours",
    "Plant fiber",
  ];
  rows.forEach((r, i) => ctx.fillText(r, cx, 300 + i * 46));
  ctx.fillStyle = "#0B1B5E";
  for (let i = 0; i < 38; i++) {
    const w = i % 3 === 0 ? 10 : 5;
    ctx.fillRect(cx - 170 + i * 9, 640, w, 110);
  }
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("Placeholder copy · not a real product", cx, 788);
  ctx.restore();
}

export function drawLabel(ctx: Ctx, f: Flavour) {
  const W = LABEL_W;
  const H = LABEL_H;
  const mix = f.id === "mix";

  // base
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix ? "#12206B" : f.base);
  g.addColorStop(1, mix ? "#0B1450" : f.dark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (mix) {
    RAINBOW.forEach((c, i) => wave(ctx, 40 + i * 44, 16, 4, 34, c, i * 0.5));
    RAINBOW.slice().reverse().forEach((c, i) => wave(ctx, H - 300 + i * 44, 16, 4, 34, c, i * 0.5 + 1));
  } else {
    wave(ctx, 60, 22, 4, 56, f.accent, 0);
    wave(ctx, 140, 22, 4, 28, "rgba(255,255,255,0.55)", 0.6);
    wave(ctx, H - 190, 26, 4, 70, f.accent, 1.2);
    wave(ctx, H - 90, 26, 4, 40, "rgba(255,255,255,0.45)", 1.8);
  }

  bubbles(ctx, W * 0.5, H * 0.5, W, H * 0.8, 70, 7);

  // side art
  const slices: [number, number, string, string][] = [
    [W * 0.17, 600, "#FF8A1F", "#FFB347"],
    [W * 0.83, 600, "#F0457F", "#FF8FB0"],
    [W * 0.33, 780, "#5DB11F", "#B5E04D"],
    [W * 0.67, 780, "#F4B800", "#FFE066"],
  ];
  slices.forEach(([x, y, a, b], i) => slice(ctx, x, y, i < 2 ? 130 : 80, a, b));

  // front
  const cx = W / 2;
  sun(ctx, cx, 470, 210, mix ? "#FFD23F" : "rgba(255,255,255,0.22)", mix ? "rgba(255,210,63,0.5)" : "rgba(255,255,255,0.16)");

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 64px ${FONT}`;
  ctx.fillStyle = mix ? "#FFD23F" : "#FFFFFF";
  ctx.fillText("fizz theory", cx, 250);

  const drawBig = (text: string, y: number, size: number) => {
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.lineJoin = "round";
    ctx.lineWidth = 26;
    ctx.strokeStyle = mix ? "#0B1450" : f.dark;
    ctx.strokeText(text, cx + 8, y + 10);
    ctx.fillStyle = "#0B1B5E";
    ctx.fillText(text, cx + 8, y + 10);
    ctx.strokeStyle = "#0B1B5E";
    ctx.lineWidth = 10;
    ctx.strokeText(text, cx, y);
    ctx.fillStyle = "#FFF8EE";
    ctx.fillText(text, cx, y);
  };
  const bigSize = Math.max(f.lines[0].length, f.lines[1].length) > 5 ? 150 : 180;
  drawBig(f.lines[0], 470, bigSize);
  drawBig(f.lines[1], 640, bigSize);

  pill(ctx, cx, 770, "SPARKLING SODA", "#FFF8EE", "#0B1B5E", 40);
  ctx.font = `700 32px ${FONT}`;
  ctx.fillStyle = "#FFF8EE";
  ctx.fillText("REAL FRUIT EXTRACTS · 12 FL OZ", cx, 850);

  // back (wraps across the seam)
  backPanel(ctx, 0, f);
  backPanel(ctx, W, f);
}

const canvasCache = new Map<string, HTMLCanvasElement>();

export function getLabelCanvas(f: Flavour) {
  let c = canvasCache.get(f.id);
  if (!c) {
    c = document.createElement("canvas");
    c.width = LABEL_W;
    c.height = LABEL_H;
    canvasCache.set(f.id, c);
    drawLabel(c.getContext("2d")!, f);
  }
  return c;
}

/** redraw once webfonts are ready, so canvases pick up the brand font */
export function redrawLabels(flavours: Flavour[]) {
  flavours.forEach((f) => {
    const c = canvasCache.get(f.id);
    if (c) drawLabel(c.getContext("2d")!, f);
  });
}

const urlCache = new Map<string, string>();
/** front-facing crop of the label, used by the flat 2D cans */
export function getFrontUrl(f: Flavour) {
  let u = urlCache.get(f.id);
  if (!u) {
    const src = getLabelCanvas(f);
    const cw = 640;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = LABEL_H;
    out.getContext("2d")!.drawImage(src, (LABEL_W - cw) / 2, 0, cw, LABEL_H, 0, 0, cw, LABEL_H);
    u = out.toDataURL("image/png");
    urlCache.set(f.id, u);
  }
  return u;
}

export function clearFrontUrls() {
  urlCache.clear();
}

export async function ensureFonts(flavours: Flavour[], onDone: () => void) {
  try {
    await Promise.all([
      document.fonts.load(`800 64px "Baloo 2"`),
      document.fonts.load(`700 30px "Baloo 2"`),
    ]);
    await document.fonts.ready;
    redrawLabels(flavours);
    clearFrontUrls();
    onDone();
  } catch {
    /* fonts unavailable: fallback stack is already used */
  }
}
