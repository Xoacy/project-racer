/**
 * Central pub/sub bus. This is the ONLY channel allowed between the UI layer
 * and the gameplay layer — neither imports classes from the other, they only
 * emit/listen on this bus. That keeps the menu system swappable/testable
 * independently of gameplay, per the project's architecture requirement.
 */

import type { VehicleId } from '@/config/vehicles';
import type { MapId } from '@/config/maps';

export interface GameEvents {
  // --- UI -> Game intents ---
  'ui:start-pressed': void;
  'ui:vehicle-selected': { vehicleId: VehicleId };
  'ui:map-selected': { mapId: MapId };
  'ui:run-confirmed': void;
  'ui:retry-pressed': void;
  'ui:back-to-menu-pressed': void;
  'ui:pause-pressed': void;
  'ui:resume-pressed': void;

  // --- Game -> UI notifications ---
  'game:state-changed': { state: string };
  'game:score-changed': { score: number; distanceMeters: number };
  'game:speed-changed': { speedKmh: number; speedRatio: number; rpm: number; gear: number };
  'game:run-started': { vehicleId: VehicleId; mapId: MapId };
  'game:run-ended': { score: number; distanceMeters: number; isNewHighScore: boolean };
  'game:collision': { atDistanceMeters: number };
}

type Handler<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<keyof GameEvents, Set<Handler<any>>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }
}

export const eventBus = new EventBus();
