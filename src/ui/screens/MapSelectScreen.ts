import { eventBus } from '@/core/EventBus';
import { MAPS } from '@/config/maps';
import type { Screen } from './Screen';

/** One card per entry in the map registry — same pattern as
 *  VehicleSelectScreen, proving both rosters are driven purely by data. */
export class MapSelectScreen implements Screen {
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'screen screen--select';
    this.element.innerHTML = `
      <h2 class="section-title">Escolha a pista</h2>
      <div class="card-grid" data-grid></div>
    `;

    const grid = this.element.querySelector('[data-grid]')!;
    for (const map of MAPS) {
      const card = document.createElement('button');
      card.className = 'card';
      card.style.setProperty('--accent', `#${map.theme.skyColor.toString(16).padStart(6, '0')}`);
      const trafficTypeLabel = map.traffic.type === 'two-way' ? 'Mão dupla' : 'Mão única';
      card.innerHTML = `
        <div class="card__swatch"></div>
        <div class="card__name">${map.name}</div>
        <div class="stat-row"><span>Tipo de Tráfego</span>${trafficTypeLabel}</div>
        <div class="stat-row"><span>Dificuldade</span>${barHtml(map.difficultyMultiplier, 1.5)}</div>
      `;
      card.addEventListener('click', () => {
        eventBus.emit('ui:map-selected', { mapId: map.id });
        eventBus.emit('ui:run-confirmed', undefined);
      });
      grid.appendChild(card);
    }
  }
}

function barHtml(value: number, max: number): string {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return `<div class="bar"><div class="bar__fill" style="width:${pct}%"></div></div>`;
}
