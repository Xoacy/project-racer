import { eventBus } from '@/core/EventBus';
import { ScoreSystem } from '@/gameplay/ScoreSystem';
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
    `;
    this.highScoreEl = this.element.querySelector('[data-high-score]')!;
    this.element.querySelector('[data-start]')!.addEventListener('click', () => {
      eventBus.emit('ui:start-pressed', undefined);
    });
  }

  onShow(): void {
    this.highScoreEl.textContent = String(ScoreSystem.getHighScore());
  }
}
