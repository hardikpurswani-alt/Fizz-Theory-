/**
 * Mutable animation state for a 3D can. GSAP (ScrollTrigger + tweens) writes to
 * these objects, React Three Fiber reads them every frame. Values are in
 * viewport-relative units so layout (DOM slots) can drive the 3D scene:
 *  x / y : -1..1 of half viewport width / height (y up)
 *  h     : can height as a fraction of viewport height
 */
export interface CanState {
  x: number;
  y: number;
  h: number;
  rx: number;
  ry: number;
  rz: number;
  /** additive offsets used by intro / flavour-pick tweens */
  dy: number;
  spin: number;
}

export const createCanState = (): CanState => ({
  x: 0.4,
  y: -3,
  h: 0.7,
  rx: 0.1,
  ry: -0.5,
  rz: -0.35,
  dy: 0,
  spin: 0,
});

export const heroCan = createCanState();
export const footerCan = createCanState();

export const pointer = { x: 0, y: 0 };
export const motion = { reduced: false };
