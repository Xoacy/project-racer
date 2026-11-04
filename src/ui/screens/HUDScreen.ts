import { eventBus } from '@/core/EventBus';
import type { InputManager } from '@/core/input/InputManager';
import type { Screen } from './Screen';

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/** In-run overlay: score/speed readout plus on-screen steer/brake buttons
 *  for touch devices (an alternative to dragging directly on the canvas —
 *  see TouchSource). Talks to gameplay only via EventBus (readout) and
 *  InputManager (the shared input abstraction every control scheme feeds
 *  into — see core/input/InputManager.ts). */
export class HUDScreen implements Screen {
  readonly element: HTMLElement;
  private unsubscribers: (() => void)[] = [];

  constructor(private inputManager: InputManager) {
    this.element = document.createElement('div');
    this.element.className = 'screen screen--hud';
    this.element.innerHTML = `
      <div class="hud-top">
        <div class="hud-score" data-score>0 m</div>
        <div class="hud-speed">
          <span data-speed>0 km/h</span>
          <span class="hud-speed-bar"><span data-speed-fill></span></span>
          <span class="hud-rpm"><b data-gear>1</b> <span data-rpm>900 rpm</span></span>
        </div>
      </div>
      ${
        isTouchDevice
          ? `<div class="hud-controls">
              <button class="hud-btn hud-btn--lane" data-lane-left aria-label="Virar para a esquerda">◀</button>
              <button class="hud-btn hud-btn--brake" data-brake aria-label="Frear">FREIO</button>
              <button class="hud-btn hud-btn--throttle" data-throttle aria-label="Acelerar">ACEL</button>
              <button class="hud-btn hud-btn--handbrake" data-handbrake aria-label="Freio de mão">MÃO</button>
              <button class="hud-btn hud-btn--lane" data-lane-right aria-label="Virar para a direita">▶</button>
            </div>`
          : ''
      }
    `;

    if (isTouchDevice) this.wireTouchControls();

    this.unsubscribers.push(
      eventBus.on('game:score-changed', ({ distanceMeters }) => {
        this.element.querySelector('[data-score]')!.textContent = `${Math.floor(distanceMeters)} m`;
      }),
      eventBus.on('game:speed-changed', ({ speedKmh, speedRatio, rpm, gear }) => {
        this.element.querySelector('[data-speed]')!.textContent = `${Math.round(speedKmh)} km/h`;
        this.element.querySelector('[data-rpm]')!.textContent = `${Math.round(rpm)} rpm`;
        this.element.querySelector('[data-gear]')!.textContent = String(gear);
        const fill = this.element.querySelector<HTMLElement>('[data-speed-fill]')!;
        fill.style.width = `${Math.round(speedRatio * 100)}%`;
      })
    );
  }

  private wireTouchControls(): void {
    const leftBtn = this.element.querySelector('[data-lane-left]')!;
    const rightBtn = this.element.querySelector('[data-lane-right]')!;
    const brakeBtn = this.element.querySelector('[data-brake]')!;
    const throttleBtn = this.element.querySelector('[data-throttle]')!;
    const handbrakeBtn = this.element.querySelector('[data-handbrake]')!;

    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.setLateralInput(-1);
    });
    leftBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.setLateralInput(0);
    });
    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.setLateralInput(1);
    });
    rightBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.setLateralInput(0);
    });
    brakeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setBrakeButtonHeld(true);
    });
    brakeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setBrakeButtonHeld(false);
    });
    throttleBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setThrottleButtonHeld(true);
    });
    throttleBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setThrottleButtonHeld(false);
    });
    handbrakeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setHandbrakeButtonHeld(true);
    });
    handbrakeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setHandbrakeButtonHeld(false);
    });
  }

  dispose(): void {
    this.unsubscribers.forEach((unsub) => unsub());
  }
}
