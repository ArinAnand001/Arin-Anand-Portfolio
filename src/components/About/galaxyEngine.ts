import { seeded } from '../../lib/utils';

/**
 * A small spiral galaxy on a 2D canvas. Stars orbit with differential rotation
 * (inner stars turn faster), so the arms slowly wind as you watch. The pointer
 * tilts the disc and brightens stars near it.
 */
export interface GalaxyOptions {
  count: number;
  dpr: number;
}

const PALETTE = ['#fff4fb', '#f5f1ff', '#e4d6ff', '#c7a5ff', '#a970ff', '#7a3ee0'];

export class GalaxyEngine {
  private ctx: CanvasRenderingContext2D;
  private size = 0;
  private n: number;
  private r: Float32Array;
  private a0: Float32Array;
  private h: Float32Array;
  private s: Float32Array;
  private b: Float32Array;
  private c: Uint8Array;
  private sprites: HTMLCanvasElement[];
  private tilt = 0.42;
  private spin = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: GalaxyOptions,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
    const n = opts.count;
    this.n = n;
    this.r = new Float32Array(n);
    this.a0 = new Float32Array(n);
    this.h = new Float32Array(n);
    this.s = new Float32Array(n);
    this.b = new Float32Array(n);
    this.c = new Uint8Array(n);
    const rnd = seeded(2024);
    const gauss = () => {
      const u = Math.max(1e-6, rnd());
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
    };
    const arms = 3;
    for (let i = 0; i < n; i++) {
      const core = rnd() < 0.22;
      const r = core ? Math.abs(gauss()) * 0.12 : 0.06 + Math.pow(rnd(), 0.75) * 0.94;
      const arm = Math.floor(rnd() * arms);
      const scatter = gauss() * (0.12 + r * 0.32);
      this.r[i] = r;
      this.a0[i] = arm * ((Math.PI * 2) / arms) + r * 5.4 + scatter;
      this.h[i] = gauss() * 0.04 * (1 - r * 0.6);
      this.s[i] = rnd() < 0.04 ? 1.6 + rnd() * 1.4 : 0.5 + rnd() * 0.9;
      this.b[i] = 0.35 + rnd() * 0.65;
      const t = Math.min(PALETTE.length - 1, Math.floor(r * PALETTE.length * 0.95 + rnd() * 1.6));
      this.c[i] = t;
    }
    this.sprites = PALETTE.map((col) => sprite(col));
  }

  resize(size: number) {
    this.size = size;
    const d = this.opts.dpr;
    this.canvas.width = Math.round(size * d);
    this.canvas.height = Math.round(size * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  /** time in seconds; px/py pointer in -1..1 relative to the canvas (0 when absent). */
  draw(time: number, px: number, py: number, energy: number) {
    const ctx = this.ctx;
    const S = this.size;
    if (!S) return;
    const cx = S / 2;
    const cy = S / 2;
    const R = S * 0.47;
    this.tilt += (0.42 + py * 0.16 - this.tilt) * 0.05;
    this.spin += (px * 0.35 - this.spin) * 0.05;
    const tilt = this.tilt;
    const rot = -0.45 + this.spin;
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);

    ctx.clearRect(0, 0, S, S);
    ctx.globalCompositeOperation = 'lighter';

    // Core glow
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
    g.addColorStop(0, `rgba(245,241,255,${0.55 + energy * 0.2})`);
    g.addColorStop(0.15, 'rgba(199,165,255,0.35)');
    g.addColorStop(0.45, 'rgba(150,60,255,0.12)');
    g.addColorStop(1, 'rgba(103,38,201,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    const spinT = time * 0.16;
    for (let i = 0; i < this.n; i++) {
      const r = this.r[i];
      const a = this.a0[i] + spinT / Math.sqrt(r + 0.05);
      const x0 = Math.cos(a) * r * R;
      const z0 = Math.sin(a) * r * R;
      const y0 = this.h[i] * R;
      // flatten into the tilted disc, then rotate in screen space
      const yy = z0 * tilt + y0;
      const x = cx + x0 * cr - yy * sr;
      const y = cy + x0 * sr + yy * cr;
      const tw = 0.75 + 0.25 * Math.sin(time * 2 + i);
      const alpha = Math.min(1, this.b[i] * tw * (0.6 + energy * 0.4));
      const s = this.s[i];
      ctx.globalAlpha = alpha;
      if (s > 1.4) {
        const k = s * 3;
        ctx.drawImage(this.sprites[this.c[i]], x - k, y - k, k * 2, k * 2);
      } else {
        ctx.fillStyle = PALETTE[this.c[i]];
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

function sprite(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  if (!g) return c;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color);
  grad.addColorStop(0.4, `${color}55`);
  grad.addColorStop(1, `${color}00`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}
