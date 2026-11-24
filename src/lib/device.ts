import { clamp } from './utils';

export type QualityTier = 'low' | 'mid' | 'high';

export interface DeviceProfile {
  tier: QualityTier;
  coarse: boolean;
  /** Device pixel ratio capped for performance. */
  dpr: number;
  /** Star budget for the global starfield. */
  stars: number;
}

/**
 * Rough capability estimate used to size particle counts and pixel ratios.
 * Errs on the side of smoothness: fewer particles on phones and low-core machines.
 */
export function getDeviceProfile(): DeviceProfile {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  let tier: QualityTier = 'high';
  if (coarse || cores <= 4 || memory <= 4) tier = 'mid';
  if (cores <= 2 || memory <= 2 || (coarse && w * h < 400_000)) tier = 'low';

  const dprCap = tier === 'high' ? 1.75 : tier === 'mid' ? 1.5 : 1.25;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

  const density = tier === 'high' ? 1 / 1250 : tier === 'mid' ? 1 / 1900 : 1 / 3400;
  const stars = Math.round(clamp(w * h * density, 160, 1400));

  return { tier, coarse, dpr, stars };
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}
