import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

/** Tilt angle (degrees) that maps to full lateral deflection. */
const MAX_TILT_DEG = 22;

/**
 * Device-tilt steering (Android/mobile browsers), off by default — touch
 * drag is the default mobile scheme (see TouchSource). A future settings
 * screen can call `requestPermissionAndEnable()` to opt in; this is kept
 * separate from `attach()` because iOS/some Android browsers require a
 * user-gesture-triggered permission prompt for orientation events.
 */
export class TiltSource implements InputSource {
  private enabled = false;

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
    this.manager.setLateralInput(0);
  }

  private handleOrientation = (e: DeviceOrientationEvent): void => {
    if (!this.enabled || e.gamma === null) return;
    const value = Math.max(-1, Math.min(1, e.gamma / MAX_TILT_DEG));
    this.manager.setLateralInput(value);
  };
}
