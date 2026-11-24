/**
 * The hero planet, drawn in a single fragment shader: no 3D library needed.
 *
 * Every pixel works out analytically what it sees - the sphere, its banded
 * gas-giant surface, the atmosphere, the ring system (with the planet's shadow
 * falling on the rings and the rings' shadow on the planet), two orbit paths and
 * three moons - then composites them back to front with soft edges.
 * Pixels far from the planet exit early, so the cost scales with its size.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;

uniform vec2 uCenter;
uniform float uRadius;
uniform float uTime;
uniform float uIntro;
uniform float uSpin;
uniform vec3 uLight;
uniform vec3 uRingN;
uniform vec3 uOrbitN0;
uniform vec3 uOrbitN1;
uniform vec2 uOrbitR;
uniform vec4 uMoon0;
uniform vec4 uMoon1;
uniform vec4 uMoon2;

const vec3 DEEP  = vec3(0.043, 0.024, 0.094);
const vec3 VDARK = vec3(0.086, 0.043, 0.173);
const vec3 ROYAL = vec3(0.404, 0.149, 0.788);
const vec3 ELEC  = vec3(0.588, 0.235, 1.000);
const vec3 LAV   = vec3(0.780, 0.647, 1.000);
const vec3 WHITE = vec3(0.961, 0.945, 1.000);

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
float fw(float v) {
#ifdef GL_OES_standard_derivatives
  return max(fwidth(v), 1e-4);
#else
  return 0.004;
#endif
}

float ringDensity(float r, float aa) {
  float t = (r - 1.38) / (2.34 - 1.38);
  if (t < 0.0 || t > 1.0) return 0.0;
  float hi = clamp(1.0 - aa * 140.0, 0.0, 1.0);
  float d = 0.52 + 0.2 * sin(r * 41.0) + 0.15 * sin(r * 97.0 + 1.3) + 0.1 * hi * sin(r * 211.0 + 0.4);
  d += 0.22 * noise(vec3(r * 64.0, 0.5, 0.5)) - 0.1;
  d *= smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.84, 1.0, t));
  float g1 = (r - 1.87) * 30.0;
  float g2 = (r - 2.13) * 55.0;
  d *= 1.0 - 0.92 * exp(-g1 * g1);
  d *= 1.0 - 0.55 * exp(-g2 * g2);
  d *= mix(0.55, 1.0, smoothstep(1.38, 1.62, r));
  return clamp(d, 0.0, 1.0);
}

// Premultiplied "over"
void over(inout vec3 col, inout float a, vec3 c, float ca) {
  col = c + col * (1.0 - ca);
  a = ca + a * (1.0 - ca);
}

vec4 moon(vec2 p, vec4 m, vec3 L, float aa) {
  vec2 d = (p - m.xy) / m.w;
  float r = length(d);
  if (r >= 1.0 || m.w <= 0.0) return vec4(0.0);
  float z = sqrt(1.0 - r * r);
  vec3 N = vec3(d, z);
  float lit = smoothstep(-0.15, 0.75, dot(N, L));
  float cr = noise(vec3(d * 5.0 + m.w * 40.0, m.w * 10.0));
  vec3 c = mix(VDARK * 1.6, LAV, 0.3 + 0.45 * cr) * (0.05 + 1.1 * lit);
  c += mix(ELEC, LAV, 0.4) * pow(1.0 - z, 3.0) * 0.6;
  float cov = 1.0 - smoothstep(1.0 - aa * 1.5, 1.0, r);
  return vec4(c * cov, cov);
}

void orbitLine(vec2 p, vec3 n, float R, float aa, float zs, float r2, bool front, inout vec3 col, inout float a) {
  float z = -(n.x * p.x + n.y * p.y) / n.z;
  if (front != (z >= 0.0)) return;
  float r = length(vec3(p, z));
  float line = 1.0 - smoothstep(0.0, aa * 1.3, abs(r - R));
  if (line <= 0.0) return;
  float vis = front ? (r2 >= 1.0 ? 1.0 : smoothstep(-0.01, 0.01, z - zs)) : 1.0;
  float k = line * vis * (front ? 0.34 : 0.13) * uIntro;
  over(col, a, LAV * k, k * 0.8);
}

void ring(vec2 p, vec3 L, float zs, float r2, float aa, bool front, inout vec3 col, inout float a) {
  vec3 n = uRingN;
  float z = -(n.x * p.x + n.y * p.y) / n.z;
  if (front != (z >= 0.0)) return;
  vec3 P = vec3(p, z);
  float rr = length(P);
  if (rr < 1.3 || rr > 2.4) return;
  float dens = ringDensity(rr, aa);
  if (dens <= 0.0) return;
  float vis = front ? (r2 >= 1.0 ? 1.0 : smoothstep(-0.008, 0.008, z - zs)) : 1.0;
  // Entrance: the rings sweep into existence around the planet.
  vec3 e1 = normalize(cross(n, vec3(0.0, 0.0, 1.0)));
  vec3 e2 = cross(n, e1);
  float ang = atan(dot(P, e2), dot(P, e1)) + 3.14159;
  float reveal = smoothstep(0.0, 0.6, uIntro * 7.2 - ang);
  // Shadow of the planet on the rings
  float b = dot(P, L);
  float sh = 1.0;
  if (b < 0.0) sh = smoothstep(0.96, 1.05, sqrt(max(dot(P, P) - b * b, 0.0)));
  float light = 0.22 + 0.78 * sh;
  vec3 rc = mix(LAV, ROYAL, smoothstep(1.45, 2.3, rr) * 0.55 + noise(vec3(rr * 90.0, 1.0, 2.0)) * 0.22);
  rc = mix(rc, WHITE, 0.18 * sh);
  float ra = dens * 0.8 * reveal * vis;
  over(col, a, rc * light * ra, ra);
}

void main() {
  vec2 p = (gl_FragCoord.xy - uCenter) / uRadius;
  float len = length(p);
  // Derivatives first, while every pixel in the quad is still running.
  float aaLen = fw(len);
  vec3 nR = uRingN;
  float aaRing = fw(length(vec3(p, -(nR.x * p.x + nR.y * p.y) / nR.z)));
  float aaO0 = fw(length(vec3(p, -(uOrbitN0.x * p.x + uOrbitN0.y * p.y) / uOrbitN0.z)));
  float aaO1 = fw(length(vec3(p, -(uOrbitN1.x * p.x + uOrbitN1.y * p.y) / uOrbitN1.z)));
  float aaM0 = fw(length((p - uMoon0.xy) / max(uMoon0.w, 1e-3)));
  float aaM1 = fw(length((p - uMoon1.xy) / max(uMoon1.w, 1e-3)));
  float aaM2 = fw(length((p - uMoon2.xy) / max(uMoon2.w, 1e-3)));

  if (len > uOrbitR.y + 0.2) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec3 L = normalize(uLight);
  float r2 = dot(p, p);
  float zs = r2 < 1.0 ? sqrt(1.0 - r2) : -10.0;
  float bright = smoothstep(0.0, 0.55, uIntro);

  vec3 col = vec3(0.0);
  float a = 0.0;

  // 1. Atmospheric glow around the disc (additive light; the planet covers the inside)
  {
    float d = max(len - 1.0, 0.0);
    float side = 0.5 + 0.5 * dot(normalize(p), normalize(L.xy + 1e-4));
    float g = (exp(-d * 10.0) * 0.8 + exp(-d * 2.4) * 0.16) * (0.35 + 0.65 * side) * bright;
    col += mix(ELEC, LAV, 0.3) * g;
    a += g * 0.5;
  }

  // 2. Everything behind the planet
  orbitLine(p, uOrbitN0, uOrbitR.x, aaO0, zs, r2, false, col, a);
  orbitLine(p, uOrbitN1, uOrbitR.y, aaO1, zs, r2, false, col, a);
  if (uMoon0.z < 0.0) { vec4 m = moon(p, uMoon0, L, aaM0) * bright; over(col, a, m.rgb, m.a); }
  if (uMoon1.z < 0.0) { vec4 m = moon(p, uMoon1, L, aaM1) * bright; over(col, a, m.rgb, m.a); }
  if (uMoon2.z < 0.0) { vec4 m = moon(p, uMoon2, L, aaM2) * bright; over(col, a, m.rgb, m.a); }
  ring(p, L, zs, r2, aaRing, false, col, a);

  // 3. The planet
  if (len < 1.0) {
    vec3 N = vec3(p, zs);
    vec3 up = nR;
    vec3 rt = normalize(cross(up, vec3(0.0, 0.0, 1.0)));
    vec3 fwd = cross(rt, up);
    vec3 q = vec3(dot(N, rt), dot(N, up), dot(N, fwd));
    float s = uSpin;
    q = vec3(cos(s) * q.x - sin(s) * q.z, q.y, sin(s) * q.x + cos(s) * q.z);
    float lat = q.y;
    float warp = fbm(q * 2.1 + vec3(0.0, 0.0, uTime * 0.012));
    float bands = sin(lat * 15.0 + warp * 3.6 + sin(lat * 4.0) * 1.6);
    float fine = fbm(vec3(q.x * 3.0, lat * 24.0 + warp * 2.6, q.z * 3.0));
    float t = bands * 0.5 + 0.5;
    vec3 surf = mix(VDARK, ROYAL, smoothstep(0.1, 0.9, t));
    surf = mix(surf, ELEC, smoothstep(0.5, 0.95, fine) * 0.55);
    surf = mix(surf, LAV, smoothstep(0.55, 0.95, t * fine * 1.5) * 0.55);
    surf = mix(surf, DEEP * 1.4, smoothstep(0.7, 0.98, abs(lat)) * 0.55);
    vec3 sc = normalize(vec3(0.45, -0.3, 0.84));
    float storm = smoothstep(0.24, 0.0, length((q - sc) * vec3(1.0, 2.5, 1.0)));
    surf = mix(surf, LAV * 1.08, storm * 0.65);

    float ndl = dot(N, L);
    float lit = smoothstep(-0.14, 0.8, ndl);
    float rs = 1.0;
    float ln = dot(L, nR);
    if (abs(ln) > 0.001) {
      float tt = -dot(N, nR) / ln;
      if (tt > 0.0) rs = 1.0 - ringDensity(length(N + L * tt), 0.0) * 0.72;
    }
    float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 20.0) * 0.14;
    vec3 c = surf * (0.045 + 1.1 * lit * rs) + LAV * spec * rs;
    c += ELEC * 0.06 * (1.0 - lit) * pow(1.0 - zs, 1.4);
    float fres = pow(1.0 - zs, 3.0);
    c += mix(ELEC, LAV, 0.5) * fres * (0.22 + 0.95 * smoothstep(-0.35, 0.6, ndl));
    c *= bright;
    float cov = 1.0 - smoothstep(1.0 - aaLen * 1.5, 1.0, len);
    over(col, a, c * cov, cov);
  }

  // 4. Everything in front of the planet
  ring(p, L, zs, r2, aaRing, true, col, a);
  orbitLine(p, uOrbitN0, uOrbitR.x, aaO0, zs, r2, true, col, a);
  orbitLine(p, uOrbitN1, uOrbitR.y, aaO1, zs, r2, true, col, a);
  if (uMoon0.z >= 0.0) { vec4 m = moon(p, uMoon0, L, aaM0) * bright; over(col, a, m.rgb, m.a); }
  if (uMoon1.z >= 0.0) { vec4 m = moon(p, uMoon1, L, aaM1) * bright; over(col, a, m.rgb, m.a); }
  if (uMoon2.z >= 0.0) { vec4 m = moon(p, uMoon2, L, aaM2) * bright; over(col, a, m.rgb, m.a); }

  // Dither to avoid banding in the soft glows
  float dn = (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col + dn, clamp(a, 0.0, 1.0));
}
`;

type Vec3 = [number, number, number];

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
/** Normal of a plane tilted toward the viewer by `incline` and rolled by `roll` (radians). */
function planeNormal(incline: number, roll: number): Vec3 {
  return normalize([-Math.sin(roll) * Math.cos(incline), Math.cos(roll) * Math.cos(incline), Math.sin(incline)]);
}

const RING_N = planeNormal(0.3, -0.34);
const ORBITS: Array<{ n: Vec3; r: number }> = [
  { n: planeNormal(0.24, -0.22), r: 2.72 },
  { n: planeNormal(0.44, -0.52), r: 3.22 },
];
const MOONS = [
  { orbit: 0, speed: 0.11, phase: 0.6, size: 0.085 },
  { orbit: 1, speed: 0.07, phase: 2.4, size: 0.06 },
  { orbit: 0, speed: 0.11, phase: 3.9, size: 0.042 },
];

function orbitPosition(n: Vec3, r: number, angle: number): Vec3 {
  const e1 = normalize(cross(n, [0, 0, 1]));
  const e2 = cross(n, e1);
  const c = Math.cos(angle) * r;
  const s = Math.sin(angle) * r;
  return [e1[0] * c + e2[0] * s, e1[1] * c + e2[1] * s, e1[2] * c + e2[2] * s];
}

export interface PlanetLayout {
  /** Planet centre and radius in CSS pixels, relative to the canvas. */
  cx: number;
  cy: number;
  radius: number;
}

export class PlanetRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private buffer: WebGLBuffer | null;
  private height = 0;
  private scale = 1;
  private layout: PlanetLayout = { cx: 0, cy: 0, radius: 100 };
  lost = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private pixelRatio: number,
  ) {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl || gl.isContextLost()) throw new Error('WebGL unavailable');
    this.gl = gl;
    gl.getExtension('OES_standard_derivatives');
    this.program = this.link(VERT, FRAG);
    gl.useProgram(this.program);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const name of [
      'uCenter',
      'uRadius',
      'uTime',
      'uIntro',
      'uSpin',
      'uLight',
      'uRingN',
      'uOrbitN0',
      'uOrbitN1',
      'uOrbitR',
      'uMoon0',
      'uMoon1',
      'uMoon2',
    ]) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }
    gl.uniform3fv(this.uniforms.uRingN, RING_N);
    gl.uniform3fv(this.uniforms.uOrbitN0, ORBITS[0].n);
    gl.uniform3fv(this.uniforms.uOrbitN1, ORBITS[1].n);
    gl.uniform2f(this.uniforms.uOrbitR, ORBITS[0].r, ORBITS[1].r);
    gl.clearColor(0, 0, 0, 0);

    canvas.addEventListener('webglcontextlost', this.onLost);
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
  };

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    if (!sh) throw new Error('Could not create shader');
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(`Shader compile failed: ${log}`);
    }
    return sh;
  }

  private link(vs: string, fs: string) {
    const gl = this.gl;
    const prog = gl.createProgram();
    if (!prog) throw new Error('Could not create program');
    gl.attachShader(prog, this.compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, this.compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(prog)}`);
    }
    return prog;
  }

  resize(width: number, height: number, layout: PlanetLayout) {
    this.height = height;
    this.layout = layout;
    // Big screens get a slightly lower internal resolution; the planet stays soft-edged anyway.
    const area = width * height;
    this.scale = this.pixelRatio * (area > 2_400_000 ? 0.8 : 1);
    const w = Math.max(1, Math.round(width * this.scale));
    const h = Math.max(1, Math.round(height * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  /**
   * @param time seconds
   * @param intro 0..1 entrance progress
   * @param px,py pointer position -1..1 (shifts the light and turns the planet a little)
   */
  render(time: number, intro: number, px: number, py: number) {
    if (this.lost) return;
    const gl = this.gl;
    const u = this.uniforms;
    const ease = 1 - Math.pow(1 - Math.min(1, intro), 3);
    const radius = this.layout.radius * (0.84 + 0.16 * ease) * this.scale;
    gl.uniform2f(u.uCenter, this.layout.cx * this.scale, (this.height - this.layout.cy) * this.scale);
    gl.uniform1f(u.uRadius, radius);
    gl.uniform1f(u.uTime, time % 1000);
    gl.uniform1f(u.uIntro, intro);
    gl.uniform1f(u.uSpin, time * 0.035 + px * 0.22 + (1 - ease) * 1.2);
    gl.uniform3fv(u.uLight, normalize([-0.62 + px * 0.28, 0.48 - py * 0.22, 0.62]));
    MOONS.forEach((m, i) => {
      const o = ORBITS[m.orbit];
      const pos = orbitPosition(o.n, o.r, time * m.speed + m.phase);
      gl.uniform4f(u[`uMoon${i}`], pos[0], pos[1], pos[2], m.size * Math.min(1, ease * 1.2));
    });
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    // The context is not force-lost here: the same <canvas> is reused if the
    // renderer restarts (for example when the visitor toggles reduced motion).
  }
}
