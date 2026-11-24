import { decayPointer, pointer, pulses } from '../../lib/pointer';
import { seeded, smoothstep } from '../../lib/utils';

export interface StarFieldOptions {
  count: number;
  dpr: number;
  reduced: boolean;
  coarse: boolean;
  tier: 'low' | 'mid' | 'high';
}

// white, pale lavender, lavender, electric violet, warm white
const COLORS = ['#f5f1ff', '#e4d6ff', '#c7a5ff', '#a970ff', '#ffe8dc'];
const COLOR_WEIGHTS = [0.46, 0.24, 0.18, 0.08, 0.04];

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  size: number;
  c: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  age: number;
  life: number;
}

const OVERSCAN = 120;

/**
 * Interactive starfield rendered on a single 2D canvas.
 * Stars keep a "home" position and a displacement. The pointer pushes them
 * away (fast movement) or draws them in with a gentle swirl (slow movement);
 * a spring returns every star home. Taps and clicks send ripples outward.
 */
export class StarFieldEngine {
  private ctx: CanvasRenderingContext2D;
  private mctx: CanvasRenderingContext2D | null;
  private w = 0;
  private h = 0;
  private hx = new Float32Array(0);
  private hy = new Float32Array(0);
  private ox = new Float32Array(0);
  private oy = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private size = new Float32Array(0);
  private depth = new Float32Array(0);
  private phase = new Float32Array(0);
  private tw = new Float32Array(0);
  private base = new Float32Array(0);
  private groups: Uint16Array[] = [];
  private sprites: HTMLCanvasElement[] = [];
  private sparks: Spark[] = [];
  private trail: Array<{ x: number; y: number }> = [];
  private meteor: Meteor | null = null;
  private nextMeteor = 0;
  private raf = 0;
  private running = false;
  private last = 0;
  private pnx = 0;
  private pny = 0;
  private resizeTimer = 0;
  private near: Array<{ x: number; y: number; d: number }> = [];
  private disposed = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private milky: HTMLCanvasElement | null,
    private opts: StarFieldOptions,
  ) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.mctx = milky?.getContext('2d', { alpha: true }) ?? null;
    this.sprites = COLORS.map((c) => makeSprite(c));
    this.resize(true);
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  start() {
    if (this.opts.reduced) {
      this.renderStatic();
      return;
    }
    if (this.running || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    this.nextMeteor = this.last + 2500;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.disposed = true;
    this.stop();
    window.clearTimeout(this.resizeTimer);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  private onVisibility = () => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.resize(false), 160);
  };

  private resize(force: boolean) {
    const w = window.innerWidth;
    const h = window.innerHeight + OVERSCAN;
    // Mobile URL bars change height constantly - ignore small height changes.
    if (!force && w === this.w && Math.abs(h - this.h) < 160) return;
    this.w = w;
    this.h = h;
    const { dpr } = this.opts;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = w * (h - OVERSCAN);
    const scale = Math.min(1.25, Math.max(0.5, area / (1440 * 900)));
    this.seed(Math.round(this.opts.count * (force ? 1 : scale / Math.max(0.5, scale))));
    this.paintMilkyWay();
    if (this.opts.reduced) this.renderStatic();
  }

  private seed(count: number) {
    const n = Math.max(80, count);
    const rnd = seeded(1337);
    this.hx = new Float32Array(n);
    this.hy = new Float32Array(n);
    this.ox = new Float32Array(n);
    this.oy = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.size = new Float32Array(n);
    this.depth = new Float32Array(n);
    this.phase = new Float32Array(n);
    this.tw = new Float32Array(n);
    this.base = new Float32Array(n);
    const buckets: number[][] = COLORS.map(() => []);
    for (let i = 0; i < n; i++) {
      this.hx[i] = rnd() * this.w;
      this.hy[i] = rnd() * this.h;
      const d = Math.pow(rnd(), 1.6) * 0.85 + 0.15;
      this.depth[i] = d;
      const big = rnd() < 0.035;
      this.size[i] = (0.45 + d * 1.15) * (big ? 2.1 : 1);
      this.phase[i] = rnd() * Math.PI * 2;
      this.tw[i] = 0.6 + rnd() * 2.2;
      this.base[i] = 0.25 + d * 0.6 + (big ? 0.15 : 0);
      let r = rnd();
      let c = 0;
      for (; c < COLOR_WEIGHTS.length - 1; c++) {
        r -= COLOR_WEIGHTS[c];
        if (r <= 0) break;
      }
      buckets[c].push(i);
    }
    this.groups = buckets.map((b) => Uint16Array.from(b));
  }

  /** The Milky Way is painted once per resize onto its own canvas. */
  private paintMilkyWay() {
    const m = this.milky;
    const ctx = this.mctx;
    if (!m || !ctx) return;
    const dpr = Math.min(this.opts.dpr, 1.5);
    const w = this.w;
    const h = Math.round((this.h - OVERSCAN) * 1.35);
    m.width = Math.round(w * dpr);
    m.height = Math.round(h * dpr);
    m.style.width = `${w}px`;
    m.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const rnd = seeded(42);
    const gauss = () => {
      const u = Math.max(1e-6, rnd());
      const v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    // Band runs from lower-left to upper-right with a gentle bow.
    const band = (t: number) => {
      const x = -0.1 * w + t * 1.2 * w;
      const y = h * (0.78 - t * 0.62) + Math.sin(t * Math.PI) * h * 0.06;
      return { x, y };
    };
    const thickness = Math.min(w, h) * 0.16;

    ctx.globalCompositeOperation = 'lighter';
    // Diffuse glow
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const { x, y } = band(t);
      const r = thickness * (1.4 + Math.sin(t * 9) * 0.25);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const purple = i % 3 === 0 ? '150,60,255' : '103,38,201';
      g.addColorStop(0, `rgba(${purple},0.075)`);
      g.addColorStop(0.5, `rgba(199,165,255,0.03)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Dense star dust
    const dust = this.opts.tier === 'high' ? 4200 : this.opts.tier === 'mid' ? 2600 : 1400;
    for (let i = 0; i < dust; i++) {
      const t = rnd();
      const { x, y } = band(t);
      const off = gauss() * thickness * 0.42;
      const sx = x + off * 0.48 + gauss() * 8;
      const sy = y + off * 0.88;
      const a = 0.08 + rnd() * 0.5 * Math.exp(-Math.abs(off) / thickness);
      ctx.fillStyle = rnd() < 0.8 ? `rgba(245,241,255,${a})` : `rgba(199,165,255,${a})`;
      const s = rnd() < 0.96 ? 0.7 : 1.3;
      ctx.fillRect(sx, sy, s, s);
    }
    // Dark dust lanes
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 14; i++) {
      const t = 0.05 + rnd() * 0.9;
      const { x, y } = band(t);
      const r = thickness * (0.25 + rnd() * 0.35);
      const g = ctx.createRadialGradient(x, y + gauss() * 6, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private renderStatic() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    for (let c = 0; c < this.groups.length; c++) {
      const group = this.groups[c];
      ctx.fillStyle = COLORS[c];
      for (let k = 0; k < group.length; k++) {
        const i = group[k];
        this.drawStar(ctx, c, this.hx[i], this.hy[i] - OVERSCAN / 2, this.size[i], this.base[i]);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawStar(ctx: CanvasRenderingContext2D, c: number, x: number, y: number, s: number, a: number) {
    ctx.globalAlpha = a > 1 ? 1 : a;
    if (s > 1.7) {
      const r = s * 3.4;
      ctx.drawImage(this.sprites[c], x - r, y - r, r * 2, r * 2);
    } else {
      ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s);
    }
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(3, (now - this.last) / 16.67);
    this.last = now;
    decayPointer(now);

    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const t = now * 0.001;
    const scroll = window.scrollY;

    if (this.milky) {
      this.milky.style.transform = `translate3d(0, ${(-scroll * 0.07).toFixed(1)}px, 0)`;
    }

    const fine = !this.opts.coarse;
    if (fine && pointer.active) {
      this.pnx += (pointer.nx - this.pnx) * 0.04 * dt;
      this.pny += (pointer.ny - this.pny) * 0.04 * dt;
    }

    const px = pointer.x;
    const py = pointer.y;
    const pActive = pointer.active;
    const speed = pointer.speed;
    const repelW = pointer.type === 'touch' ? 1 : smoothstep(1.1, 4.5, speed);
    const gravW = pointer.type === 'touch' ? 0 : 1 - repelW;
    const R = this.opts.coarse ? 120 : 160;
    const R2 = R * R;
    const RG = 230;
    const RG2 = RG * RG;
    const repelStrength = 0.75 + Math.min(speed, 30) * 0.055;
    const spring = 0.014 * dt;
    const damp = Math.pow(0.9, dt);

    // Active ripples
    const ripples: Array<{ x: number; y: number; r: number; f: number }> = [];
    for (let p = pulses.length - 1; p >= 0; p--) {
      const age = (now - pulses[p].t) / 1000;
      if (age > 1.5) {
        pulses.splice(p, 1);
        continue;
      }
      ripples.push({ x: pulses[p].x, y: pulses[p].y, r: age * 540, f: (1 - age / 1.5) * pulses[p].strength });
      if (age < 0.02) this.burst(pulses[p].x, pulses[p].y, pulses[p].strength);
    }

    ctx.clearRect(0, 0, w, h);
    const near = this.near;
    near.length = 0;
    const driftT = t * 3;

    for (let c = 0; c < this.groups.length; c++) {
      const group = this.groups[c];
      ctx.fillStyle = COLORS[c];
      for (let k = 0; k < group.length; k++) {
        const i = group[k];
        const d = this.depth[i];
        let tx = this.hx[i] + driftT * d - this.pnx * d * 14;
        tx = ((tx % w) + w) % w;
        let ty = this.hy[i] - scroll * (0.03 + d * 0.2) - this.pny * d * 10;
        ty = ((ty % h) + h) % h - OVERSCAN / 2;

        let ox = this.ox[i];
        let oy = this.oy[i];
        let vx = this.vx[i];
        let vy = this.vy[i];
        const x = tx + ox;
        const y = ty + oy;

        if (pActive) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < RG2) {
            const dist = Math.sqrt(d2) + 0.0001;
            const ux = dx / dist;
            const uy = dy / dist;
            if (repelW > 0.01 && d2 < R2) {
              const f = 1 - dist / R;
              const F = f * f * repelStrength * repelW * (0.55 + d * 0.6) * dt;
              vx += ux * F;
              vy += uy * F;
            }
            if (gravW > 0.01) {
              const g = (1 - dist / RG) * 0.055 * gravW * (0.4 + d) * dt;
              if (dist > 28) {
                vx -= ux * g;
                vy -= uy * g;
              } else {
                vx += ux * g * 1.6;
                vy += uy * g * 1.6;
              }
              vx += -uy * g * 0.6;
              vy += ux * g * 0.6;
              if (d > 0.45 && dist < 130 && near.length < 7) near.push({ x, y, d: dist });
            }
          }
        }

        for (let r = 0; r < ripples.length; r++) {
          const rp = ripples[r];
          const dx = x - rp.x;
          const dy = y - rp.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
          const diff = Math.abs(dist - rp.r);
          if (diff < 70) {
            const F = (1 - diff / 70) * rp.f * 2.4 * (0.45 + d) * dt;
            vx += (dx / dist) * F;
            vy += (dy / dist) * F;
          }
        }

        vx = (vx - ox * spring) * damp;
        vy = (vy - oy * spring) * damp;
        ox += vx * dt;
        oy += vy * dt;
        this.ox[i] = ox;
        this.oy[i] = oy;
        this.vx[i] = vx;
        this.vy[i] = vy;

        const energy = Math.min(0.7, (Math.abs(vx) + Math.abs(vy)) * 0.12 + Math.abs(ox + oy) * 0.003);
        const tw = 0.7 + 0.3 * Math.sin(t * this.tw[i] + this.phase[i]);
        this.drawStar(ctx, c, tx + ox, ty + oy, this.size[i] * (1 + energy * 0.6), this.base[i] * tw + energy);
      }
    }
    ctx.globalAlpha = 1;

    // Gravitational threads from a slow cursor to nearby stars
    if (near.length && gravW > 0.3) {
      ctx.lineWidth = 0.6;
      for (const s of near) {
        ctx.strokeStyle = `rgba(199,165,255,${((1 - s.d / 130) * 0.22 * gravW).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    }

    this.updateTrail(now, dt);
    this.updateMeteor(now, dt);
  };

  private burst(x: number, y: number, strength: number) {
    const count = Math.round(10 + strength * 10);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const sp = 1.2 + Math.random() * 2.2 * strength;
      this.spawnSpark(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.7 + Math.random() * 0.6);
    }
  }

  private spawnSpark(x: number, y: number, vx: number, vy: number, life: number) {
    if (this.sparks.length > 160) this.sparks.shift();
    this.sparks.push({
      x,
      y,
      vx,
      vy,
      life,
      age: 0,
      size: 0.9 + Math.random() * 1.6,
      c: Math.random() < 0.5 ? 2 : Math.random() < 0.6 ? 3 : 0,
    });
  }

  private updateTrail(now: number, dt: number) {
    const ctx = this.ctx;
    const moving = pointer.active && pointer.type !== 'touch' && now - pointer.lastMove < 40;
    if (moving && !this.opts.coarse) {
      this.trail.push({ x: pointer.x, y: pointer.y });
      if (pointer.speed > 0.6) {
        const count = Math.min(3, Math.floor(pointer.speed * 0.12 + Math.random()));
        for (let i = 0; i < count; i++) {
          this.spawnSpark(
            pointer.x + (Math.random() - 0.5) * 6,
            pointer.y + (Math.random() - 0.5) * 6,
            -pointer.vx * 0.05 + (Math.random() - 0.5) * 0.6,
            -pointer.vy * 0.05 + (Math.random() - 0.5) * 0.6 + 0.12,
            0.6 + Math.random() * 0.7,
          );
        }
      }
    } else if (this.trail.length) {
      this.trail.shift();
    }
    if (this.trail.length > 18) this.trail.shift();

    ctx.globalCompositeOperation = 'lighter';
    // Fading luminous trail
    const tr = this.trail;
    if (tr.length > 2) {
      ctx.lineCap = 'round';
      for (let i = 1; i < tr.length; i++) {
        const k = i / tr.length;
        ctx.strokeStyle = `rgba(167,112,255,${(k * 0.28).toFixed(3)})`;
        ctx.lineWidth = k * 2.4;
        ctx.beginPath();
        ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }
    }
    // Sparks
    const sp = this.sparks;
    for (let i = sp.length - 1; i >= 0; i--) {
      const s = sp[i];
      s.age += dt / 60;
      if (s.age >= s.life) {
        sp.splice(i, 1);
        continue;
      }
      s.vx *= Math.pow(0.96, dt);
      s.vy *= Math.pow(0.96, dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.age / s.life;
      const r = s.size * 3 * (0.4 + k * 0.6);
      ctx.globalAlpha = k * k * 0.9;
      ctx.drawImage(this.sprites[s.c], s.x - r, s.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private updateMeteor(now: number, dt: number) {
    const ctx = this.ctx;
    if (!this.meteor && now > this.nextMeteor) {
      const fromLeft = Math.random() < 0.5;
      const angle = fromLeft ? 0.42 + Math.random() * 0.25 : Math.PI - 0.42 - Math.random() * 0.25;
      const speed = 13 + Math.random() * 7;
      this.meteor = {
        x: this.w * (fromLeft ? 0.05 + Math.random() * 0.45 : 0.5 + Math.random() * 0.45),
        y: this.h * Math.random() * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 110 + Math.random() * 120,
        age: 0,
        life: 46 + Math.random() * 20,
      };
      this.nextMeteor = now + 4500 + Math.random() * 8000;
    }
    const m = this.meteor;
    if (!m) return;
    m.age += dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    const k = m.age / m.life;
    if (k >= 1) {
      this.meteor = null;
      return;
    }
    const fade = Math.sin(k * Math.PI);
    const sp = Math.hypot(m.vx, m.vy);
    const tx = m.x - (m.vx / sp) * m.len;
    const ty = m.y - (m.vy / sp) * m.len;
    const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
    g.addColorStop(0, `rgba(245,241,255,${0.9 * fade})`);
    g.addColorStop(0.25, `rgba(199,165,255,${0.45 * fade})`);
    g.addColorStop(1, 'rgba(150,60,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
}

function makeSprite(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d');
  if (!g) return c;
  const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  grad.addColorStop(0, color);
  grad.addColorStop(0.18, color);
  grad.addColorStop(0.32, hexA(color, 0.35));
  grad.addColorStop(1, hexA(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 48, 48);
  return c;
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
