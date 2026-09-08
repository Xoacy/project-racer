import { eventBus } from '@/core/EventBus';
import type { InputManager } from '@/core/input/InputManager';
import type { Screen } from './Screen';

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/** In-run overlay: score/speed readout plus on-screen lane/brake buttons
 *  for touch devices. Talks to gameplay only via EventBus (readout) and
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
        <div class="hud-speed" data-speed>0 km/h</div>
      </div>
      ${
        isTouchDevice
          ? `<div class="hud-controls">
              <button class="hud-btn hud-btn--lane" data-lane-left aria-label="Mudar para faixa esquerda">◀</button>
              <button class="hud-btn hud-btn--brake" data-brake aria-label="Frear">FREIO</button>
              <button class="hud-btn hud-btn--lane" data-lane-right aria-label="Mudar para faixa direita">▶</button>
            </div>`
          : ''
      }
    `;

    if (isTouchDevice) this.wireTouchControls();

    this.unsubscribers.push(
      eventBus.on('game:score-changed', ({ distanceMeters }) => {
        this.element.querySelector('[data-score]')!.textContent = `${Math.floor(distanceMeters)} m`;
      }),
      eventBus.on('game:speed-changed', ({ speedKmh }) => {
        this.element.querySelector('[data-speed]')!.textContent = `${Math.round(speedKmh)} km/h`;
      })
    );
  }

  private wireTouchControls(): void {
    const leftBtn = this.element.querySelector('[data-lane-left]')!;
    const rightBtn = this.element.querySelector('[data-lane-right]')!;
    const brakeBtn = this.element.querySelector('[data-brake]')!;

    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.requestLaneChange(-1);
      this.inputManager.setLaneHeld(-1);
    });
    leftBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.setLaneHeld(null);
    });
    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.requestLaneChange(1);
      this.inputManager.setLaneHeld(1);
    });
    rightBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.setLaneHeld(null);
    });
    brakeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setBrakeButtonHeld(true);
    });
    brakeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.touchControls.setBrakeButtonHeld(false);
    });
  }

  dispose(): void {
    this.unsubscribers.forEach((unsub) => unsub());
  }
}
