import { eventBus } from '@/core/EventBus';
import { ScoreSystem } from '@/gameplay/ScoreSystem';
import {
  getSteeringSensitivity,
  setSteeringSensitivity,
  STEERING_SENSITIVITY_MAX,
  STEERING_SENSITIVITY_MIN,
} from '@/core/input/steeringSensitivity';
import type { Screen } from './Screen';

export class MainMenuScreen implements Screen {
  readonly element: HTMLElement;
  private highScoreEl: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'screen screen--menu';
    this.element.innerHTML = `
      <h1 class="title">PROJECT RACER</h1>
      <p class="subtitle">corrida infinita &mdash; esqueleto de gameplay</p>
      <p class="high-score">Recorde: <span data-high-score>0</span> m</p>
      <button class="btn btn--primary" data-start>Jogar</button>
      <label class="sensitivity">
        <span>Sensibilidade da direção</span>
        <input
          type="range"
          data-sensitivity
          min="${STEERING_SENSITIVITY_MIN}"
          max="${STEERING_SENSITIVITY_MAX}"
          step="0.05"
        />
      </label>
    `;
    this.highScoreEl = this.element.querySelector('[data-high-score]')!;
    this.element.querySelector('[data-start]')!.addEventListener('click', () => {
      eventBus.emit('ui:start-pressed', undefined);
    });

    const sensitivity = this.element.querySelector<HTMLInputElement>('[data-sensitivity]')!;
    sensitivity.value = String(getSteeringSensitivity());
    sensitivity.addEventListener('input', () => {
      setSteeringSensitivity(Number(sensitivity.value));
    });
  }

  onShow(): void {
    this.highScoreEl.textContent = String(ScoreSystem.getHighScore());
  }
}
