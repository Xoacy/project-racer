import { eventBus } from '@/core/EventBus';
import { VEHICLES } from '@/config/vehicles';
import type { Screen } from './Screen';

/** Renders one card per entry in the vehicle registry — add a vehicle to
 *  `config/vehicles/index.ts` and it shows up here automatically. */
export class VehicleSelectScreen implements Screen {
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'screen screen--select';
    this.element.innerHTML = `
      <h2 class="section-title">Escolha seu veículo</h2>
      <div class="card-grid" data-grid></div>
    `;

    const grid = this.element.querySelector('[data-grid]')!;
    for (const vehicle of VEHICLES) {
      const card = document.createElement('button');
      card.className = 'card';
      card.style.setProperty('--accent', `#${vehicle.placeholderColor.toString(16).padStart(6, '0')}`);
      card.innerHTML = `
        <div class="card__swatch"></div>
        <div class="card__name">${vehicle.name}</div>
        <div class="stat-row"><span>Velocidade</span>${barHtml(vehicle.physics.maxSpeed, 60)}</div>
        <div class="stat-row"><span>Aceleração</span>${barHtml(vehicle.physics.acceleration, 20)}</div>
        <div class="stat-row"><span>Manejo</span>${barHtml(vehicle.physics.handling, 12)}</div>
      `;
      card.addEventListener('click', () => {
        eventBus.emit('ui:vehicle-selected', { vehicleId: vehicle.id });
      });
      grid.appendChild(card);
    }
  }
}

function barHtml(value: number, max: number): string {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return `<div class="bar"><div class="bar__fill" style="width:${pct}%"></div></div>`;
}
