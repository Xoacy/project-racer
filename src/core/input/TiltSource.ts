import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

const TRIGGER_ANGLE_DEG = 14;
const NEUTRAL_ANGLE_DEG = 6; // hysteresis: must return inside this band to re-arm

/**
 * Device-tilt steering (Android/mobile browsers), off by default — swipe is
 * the default mobile scheme (see TouchSource). A future settings screen can
 * call `requestPermissionAndEnable()` to opt in; this is intentionally
 * separate from `attach()` because iOS/some Android browsers require a
 * user-gesture-triggered permission prompt for orientation events.
 */
export class TiltSource implements InputSource {
  private enabled = false;
  private armed = true; // must recenter before triggering again

  constructor(private manager: InputManager) {}

  attach(): void {
    // Listener is added here but does nothing until `enabled` is true, so
    // enabling later doesn't require re-attaching.
    window.addEventListener('deviceorientation', this.handleOrientation);
  }

  detach(): void {
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }

  async requestPermissionAndEnable(): Promise<boolean> {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        this.enabled = result === 'granted';
        return this.enabled;
      } catch {
        this.enabled = false;
        return false;
      }
    }
    // Most Android browsers don't gate this behind a permission prompt.
    this.enabled = true;
    return true;
  }

  disable(): void {
    this.enabled = false;
  }

  private handleOrientation = (e: DeviceOrientationEvent): void => {
    if (!this.enabled || e.gamma === null) return;
    const gamma = e.gamma; // left/right tilt in degrees

    if (this.armed && Math.abs(gamma) >= TRIGGER_ANGLE_DEG) {
      this.manager.requestLaneChange(gamma > 0 ? 1 : -1);
      this.armed = false;
    } else if (!this.armed && Math.abs(gamma) <= NEUTRAL_ANGLE_DEG) {
      this.armed = true;
    }
  };
}
