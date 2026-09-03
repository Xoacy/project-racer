import { eventBus } from '@/core/EventBus';
import type { Screen } from './Screen';

export class GameOverScreen implements Screen {
  readonly element: HTMLElement;
  private unsubscribe: () => void;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'screen screen--gameover';
    this.element.innerHTML = `
      <h2 class="section-title">Colisão!</h2>
      <p class="new-record" data-record hidden>Novo recorde!</p>
      <p class="final-score"><span data-score>0</span> m</p>
      <button class="btn btn--primary" data-retry>Tentar novamente</button>
      <button class="btn btn--secondary" data-menu>Menu</button>
    `;

    this.element.querySelector('[data-retry]')!.addEventListener('click', () => {
      eventBus.emit('ui:retry-pressed', undefined);
    });
    this.element.querySelector('[data-menu]')!.addEventListener('click', () => {
      eventBus.emit('ui:back-to-menu-pressed', undefined);
    });

    this.unsubscribe = eventBus.on('game:run-ended', ({ distanceMeters, isNewHighScore }) => {
      this.element.querySelector('[data-score]')!.textContent = String(Math.floor(distanceMeters));
      this.element.querySelector('[data-record]')!.toggleAttribute('hidden', !isNewHighScore);
    });
  }

  dispose(): void {
    this.unsubscribe();
  }
}
