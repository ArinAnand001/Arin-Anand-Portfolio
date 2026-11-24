import type { PlaygroundMode } from '../../data/experiments';

/**
 * The Creative Experiments playground: four small interactive universes sharing
 * one canvas. Each mode keeps working on its own when nobody is touching it,
 * so the section is alive for keyboard and touch visitors too.
 */

const PAL = ['#f5f1ff', '#e4d6ff', '#c7a5ff', '#a970ff', '#963cff', '#6726c9'];
const rgb = PAL.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
});

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  life: number;
  size: number;
  c: number;
  px: number;
  py: number;
}

export class PlaygroundEngine {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private mode: PlaygroundMode = 'gravity';
  private parts: P[] = [];
  private wells: Array<{ x: number; y: number; t: number }> = [];
  private pinned: number[] = [];
  private blobs: P[] = [];
  private sprites: HTMLCanvasElement[];
  private px = -1;
  private py = -1;
  private inside = false;
  private down = false;
  private warp = 1;
  private lastInput = 0;
  private time = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private dpr: number,
    private budget: number,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
    this.sprites = PAL.map((c) => glow(c));
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.setMode(this.mode, true);
  }

  setMode(mode: PlaygroundMode, force = false) {
    if (mode === this.mode && !force && this.parts.length) return;
    this.mode = mode;
    this.parts = [];
    this.wells = [];
    this.pinned = [];
    this.blobs = [];
    const { w, h } = this;
    const rnd = Math.random;
    const make = (x: number, y: number, z = 1): P => ({ x, y, vx: 0, vy: 0, z, life: 1, size: 1, c: 0, px: x, py: y });
    if (mode === 'gravity') {
      const n = Math.round(this.budget * 0.9);
      for (let i = 0; i < n; i++) {
        const p = make(rnd() * w, rnd() * h);
        const a = rnd() * Math.PI * 2;
        p.vx = Math.cos(a) * 0.6;
        p.vy = Math.sin(a) * 0.6;
        p.c = Math.floor(rnd() * PAL.length);
        p.size = 0.8 + rnd() * 1.2;
        this.parts.push(p);
      }
    } else if (mode === 'constellation') {
      const n = Math.round(Math.min(220, (w * h) / 3200));
      for (let i = 0; i < n; i++) {
        const p = make(rnd() * w, rnd() * h);
        p.vx = (rnd() - 0.5) * 0.12;
        p.vy = (rnd() - 0.5) * 0.12;
        p.size = rnd() < 0.1 ? 2.2 : 0.8 + rnd() * 1.1;
        p.c = Math.floor(rnd() * 3);
        p.z = rnd() * Math.PI * 2;
        this.parts.push(p);
      }
    } else if (mode === 'warp') {
      const n = Math.round(this.budget * 0.7);
      for (let i = 0; i < n; i++) this.parts.push(this.warpStar(make(0, 0), true));
    }
    this.clear(1);
  }

  private warpStar(p: P, scatter: boolean): P {
    p.x = (Math.random() - 0.5) * 2;
    p.y = (Math.random() - 0.5) * 2;
    p.z = scatter ? Math.random() * 1 + 0.02 : 1;
    p.px = NaN;
    p.py = NaN;
    p.c = Math.floor(Math.random() * 4);
    return p;
  }

  pointerMove(x: number, y: number) {
    this.px = x;
    this.py = y;
    this.inside = true;
    this.lastInput = this.time;
  }
  pointerLeave() {
    this.inside = false;
    this.down = false;
  }
  pointerDown(x: number, y: number) {
    this.pointerMove(x, y);
    this.down = true;
    this.action(x, y);
  }
  pointerUp() {
    this.down = false;
  }
  /** Keyboard: hold to accelerate (warp mode). */
  hold(on: boolean) {
    this.down = on;
  }
  /** Keyboard / button trigger: act at the centre. */
  trigger() {
    this.lastInput = this.time;
    this.action(this.w / 2, this.h / 2);
  }
  reset() {
    this.setMode(this.mode, true);
  }

  private action(x: number, y: number) {
    if (this.mode === 'gravity') {
      this.wells.push({ x, y, t: this.time });
      if (this.wells.length > 4) this.wells.shift();
    } else if (this.mode === 'constellation') {
      let best = -1;
      let bd = 40 * 40;
      this.parts.forEach((p, i) => {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best < 0) {
        // No star close by: make one
        this.parts.push({ x, y, vx: 0, vy: 0, z: 0, life: 1, size: 2.2, c: 0, px: x, py: y });
        best = this.parts.length - 1;
      }
      if (!this.pinned.includes(best)) this.pinned.push(best);
      if (this.pinned.length > 14) this.pinned.shift();
    } else if (this.mode === 'nebula') {
      for (let i = 0; i < 26; i++) this.emit(x, y, 2.6, true);
    }
  }

  private emit(x: number, y: number, speed: number, burst = false) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * speed;
    // Nebula gas uses the lavender-to-royal end of the palette
    const hue = 2 + Math.floor((this.time * 0.25 + Math.random() * 1.5) % 4);
    this.blobs.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      z: 0,
      life: burst ? 1.6 : 2.6 + Math.random() * 1.5,
      size: burst ? 8 + Math.random() * 14 : 18 + Math.random() * 26,
      c: hue,
      px: 0,
      py: 0,
    });
    if (this.blobs.length > 420) this.blobs.shift();
  }

  private clear(alpha: number) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#07040f';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalAlpha = 1;
  }

  /** Where the "hand" is: the pointer, or an automatic wanderer when idle. */
  private probe() {
    const idle = !this.inside || this.time - this.lastInput > 4;
    if (!idle) return { x: this.px, y: this.py, auto: false };
    const t = this.time * 0.35;
    return {
      x: this.w * (0.5 + 0.32 * Math.sin(t * 1.3)),
      y: this.h * (0.5 + 0.3 * Math.sin(t * 0.9 + 1.2)),
      auto: true,
    };
  }

  step(dt: number) {
    this.time += dt / 60;
    switch (this.mode) {
      case 'gravity':
        return this.gravity(dt);
      case 'constellation':
        return this.constellation(dt);
      case 'nebula':
        return this.nebula(dt);
      case 'warp':
        return this.warpDrive(dt);
    }
  }

  /** Render a single still frame (reduced motion). */
  still() {
    for (let i = 0; i < 90; i++) this.step(1);
  }

  private gravity(dt: number) {
    const ctx = this.ctx;
    this.clear(0.16);
    const hand = this.probe();
    const wells = [{ x: hand.x, y: hand.y, m: hand.auto ? 0.6 : 1.1 }, ...this.wells.map((w) => ({ x: w.x, y: w.y, m: 0.9 }))];
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      for (const w of wells) {
        const dx = w.x - p.x;
        const dy = w.y - p.y;
        const d2 = dx * dx + dy * dy + 900;
        const f = (w.m * 220) / d2;
        const inv = 1 / Math.sqrt(d2);
        p.vx += dx * inv * f * dt;
        p.vy += dy * inv * f * dt;
      }
      p.vx *= Math.pow(0.992, dt);
      p.vy *= Math.pow(0.992, dt);
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 7) {
        p.vx *= 7 / sp;
        p.vy *= 7 / sp;
      }
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -20) p.x += this.w + 40;
      if (p.x > this.w + 20) p.x -= this.w + 40;
      if (p.y < -20) p.y += this.h + 40;
      if (p.y > this.h + 20) p.y -= this.h + 40;
      const c = rgb[Math.min(PAL.length - 1, Math.floor(5 - Math.min(5, sp)))];
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.75)`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      if (Math.abs(p.x - p.px) < 60 && Math.abs(p.y - p.py) < 60) {
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    for (const w of wells) {
      const r = 26 + Math.sin(this.time * 3) * 3;
      ctx.drawImage(this.sprites[0], w.x - r, w.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private constellation(dt: number) {
    const ctx = this.ctx;
    this.clear(1);
    const hand = this.probe();
    const R = 150;
    const near: number[] = [];
    this.parts.forEach((p, i) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0 || p.x > this.w) p.vx *= -1;
      if (p.y < 0 || p.y > this.h) p.vy *= -1;
      if ((p.x - hand.x) ** 2 + (p.y - hand.y) ** 2 < R * R) near.push(i);
    });
    ctx.lineWidth = 0.7;
    for (let a = 0; a < near.length; a++) {
      const p = this.parts[near[a]];
      for (let b = a + 1; b < near.length; b++) {
        const q = this.parts[near[b]];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d > 110) continue;
        ctx.strokeStyle = `rgba(199,165,255,${((1 - d / 110) * 0.55).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
    if (this.pinned.length > 1) {
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(245,241,255,0.85)';
      ctx.shadowColor = '#963cff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      this.pinned.forEach((idx, k) => {
        const p = this.parts[idx];
        if (k === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalCompositeOperation = 'lighter';
    this.parts.forEach((p, i) => {
      const pin = this.pinned.includes(i);
      const tw = 0.6 + 0.4 * Math.sin(this.time * 2 + p.z);
      const s = pin ? 5 : p.size * (near.includes(i) ? 1.6 : 1);
      ctx.globalAlpha = pin ? 1 : tw;
      if (pin || s > 1.8) {
        const r = s * 3.2;
        ctx.drawImage(this.sprites[pin ? 0 : 2], p.x - r, p.y - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = PAL[p.c];
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (!hand.auto) {
      ctx.strokeStyle = 'rgba(199,165,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, R, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private nebula(dt: number) {
    const ctx = this.ctx;
    this.clear(0.08);
    const hand = this.probe();
    const moving = this.inside || hand.auto;
    if (moving) {
      const count = hand.auto ? 1 : 2;
      for (let i = 0; i < count; i++) this.emit(hand.x, hand.y, 0.8);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.blobs.length - 1; i >= 0; i--) {
      const b = this.blobs[i];
      b.z += dt / 60;
      const k = b.z / b.life;
      if (k >= 1) {
        this.blobs.splice(i, 1);
        continue;
      }
      b.vx *= Math.pow(0.97, dt);
      b.vy *= Math.pow(0.97, dt);
      b.x += b.vx * dt + Math.sin(this.time + b.y * 0.01) * 0.15 * dt;
      b.y += b.vy * dt - 0.05 * dt;
      const r = b.size * (0.6 + k * 1.4);
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.035;
      ctx.drawImage(this.sprites[b.c], b.x - r, b.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private warpDrive(dt: number) {
    const ctx = this.ctx;
    const target = this.down ? 14 : 1;
    this.warp += (target - this.warp) * (1 - Math.pow(0.94, dt));
    this.clear(this.warp > 3 ? 0.28 : 0.6);
    const hand = this.probe();
    const cx = this.w / 2 + (hand.auto ? 0 : (hand.x - this.w / 2) * 0.35);
    const cy = this.h / 2 + (hand.auto ? 0 : (hand.y - this.h / 2) * 0.35);
    const scale = Math.max(this.w, this.h) * 0.6;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const p of this.parts) {
      p.z -= 0.0035 * this.warp * dt;
      if (p.z <= 0.02) {
        this.warpStar(p, false);
        continue;
      }
      const sx = cx + (p.x / p.z) * scale;
      const sy = cy + (p.y / p.z) * scale;
      if (sx < -50 || sx > this.w + 50 || sy < -50 || sy > this.h + 50) {
        this.warpStar(p, false);
        continue;
      }
      const near = 1 - p.z;
      const c = rgb[p.c];
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.2 + near * 0.8).toFixed(3)})`;
      ctx.lineWidth = 0.6 + near * 2.2;
      ctx.beginPath();
      if (Number.isFinite(p.px)) ctx.moveTo(p.px, p.py);
      else ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 0.1, sy + 0.1);
      ctx.stroke();
      p.px = sx;
      p.py = sy;
    }
    const r = 40 + this.warp * 6;
    ctx.globalAlpha = Math.min(1, 0.25 + this.warp * 0.05);
    ctx.drawImage(this.sprites[4], cx - r, cy - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

function glow(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return c;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.2, `${color}cc`);
  grad.addColorStop(0.5, `${color}33`);
  grad.addColorStop(1, `${color}00`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}
