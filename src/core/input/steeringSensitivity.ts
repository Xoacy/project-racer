import { clamp } from '@/utils/MathUtils';

const STORAGE_KEY = 'project-racer.steering-sensitivity';
export const STEERING_SENSITIVITY_MIN = 0.6;
export const STEERING_SENSITIVITY_MAX = 1.4;
const DEFAULT = 1;

export function getSteeringSensitivity(): number {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0
    ? clamp(stored, STEERING_SENSITIVITY_MIN, STEERING_SENSITIVITY_MAX)
    : DEFAULT;
}

export function setSteeringSensitivity(value: number): void {
  localStorage.setItem(
    STORAGE_KEY,
    String(clamp(value, STEERING_SENSITIVITY_MIN, STEERING_SENSITIVITY_MAX))
  );
}
