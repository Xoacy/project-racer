import * as THREE from 'three';
import { GameState } from './GameState';
import { SceneManager } from './SceneManager';
import { AssetLoader } from './AssetLoader';
import { InputManager } from './input/InputManager';
import { eventBus } from './EventBus';
import { RunSession } from '@/gameplay/RunSession';
import { getVehicleById, VEHICLES, type VehicleId } from '@/config/vehicles';
import { getMapById, MAPS, type MapId } from '@/config/maps';
import { UIManager } from '@/ui/UIManager';

const MAX_DT = 1 / 20; // clamp huge frame gaps (tab switches) so physics doesn't jump

/**
 * Top-level orchestrator: owns the render loop and the menu <-> gameplay
 * state machine. This is the only class that imports both `@/ui` and
 * `@/gameplay` — everyone else stays on one side of that line and talks
 * across it only through EventBus.
 */
export class Game {
  private sceneManager: SceneManager;
  private assetLoader = new AssetLoader();
  private inputManager: InputManager;

  private state: GameState = GameState.MAIN_MENU;
  private selectedVehicleId: VehicleId = VEHICLES[0].id;
  private selectedMapId: MapId = MAPS[0].id;

  private runSession: RunSession | null = null;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.sceneManager = new SceneManager(canvas);
    this.inputManager = new InputManager(canvas);
    this.inputManager.attach();
    new UIManager(uiRoot, this.inputManager);

    this.bindEvents();
    this.setState(GameState.MAIN_MENU);

    this.clock.start();
    requestAnimationFrame(this.loop);
  }

  private bindEvents(): void {
    eventBus.on('ui:start-pressed', () => this.setState(GameState.VEHICLE_SELECT));

    eventBus.on('ui:vehicle-selected', ({ vehicleId }) => {
      this.selectedVehicleId = vehicleId as VehicleId;
      this.setState(GameState.MAP_SELECT);
    });

    eventBus.on('ui:map-selected', ({ mapId }) => {
      this.selectedMapId = mapId as MapId;
    });

    eventBus.on('ui:run-confirmed', () => this.startRun());
    eventBus.on('ui:retry-pressed', () => this.startRun());
    eventBus.on('ui:back-to-menu-pressed', () => {
      this.endRun();
      this.setState(GameState.MAIN_MENU);
    });
  }

  private setState(state: GameState): void {
    this.state = state;
    eventBus.emit('game:state-changed', { state });
  }

  private startRun(): void {
    this.endRun();
    const vehicle = getVehicleById(this.selectedVehicleId);
    const map = getMapById(this.selectedMapId);
    this.runSession = new RunSession(this.sceneManager, this.assetLoader, this.inputManager, vehicle, map);
    this.setState(GameState.PLAYING);
  }

  private endRun(): void {
    this.runSession?.dispose();
    this.runSession = null;
  }

  private loop = (): void => {
    const dt = Math.min(this.clock.getDelta(), MAX_DT);

    if (this.state === GameState.PLAYING && this.runSession) {
      const ended = this.runSession.update(dt);
      if (ended) this.setState(GameState.GAME_OVER);
    }

    this.sceneManager.render();
    requestAnimationFrame(this.loop);
  };
}
