import { clamp } from '@/utils/MathUtils';

export interface TireForces {
  fx: number;
  fy: number;
}

const LONGITUDINAL = { b: 10, c: 1.65, e: 0.9 };
const LATERAL = { b: 9, c: 1.35, e: 0.95 };

function magic(input: number, b: number, c: number, e: number): number {
  const bx = b * input;
  return Math.sin(c * Math.atan(bx - e * (bx - Math.atan(bx))));
}

/**
 * Pacejka-style pure-slip curves, one for longitudinal (kappa) and one for
 * lateral (slip angle), combined through a friction ellipse. The pure peaks
 * are independent (muX != muY), and the combined force is scaled back into
 * the ellipse instead of splitting one normalized slip vector.
 */
export function computeTireForces(
  slipRatio: number,
  slipAngle: number,
  load: number,
  muX: number,
  muY: number
): TireForces {
  if (load <= 0) return { fx: 0, fy: 0 };

  const kappa = clamp(slipRatio, -3, 3);
  const alpha = clamp(slipAngle, -0.7, 0.7);
  const maxX = muX * load;
  const maxY = muY * load;

  const fx0 = maxX * magic(kappa, LONGITUDINAL.b, LONGITUDINAL.c, LONGITUDINAL.e);
  const fy0 = -maxY * magic(alpha, LATERAL.b, LATERAL.c, LATERAL.e);

  const nx = maxX > 0 ? fx0 / maxX : 0;
  const ny = maxY > 0 ? fy0 / maxY : 0;
  const combined = Math.hypot(nx, ny);
  if (combined > 1) {
    return { fx: fx0 / combined, fy: fy0 / combined };
  }
  return { fx: fx0, fy: fy0 };
}
