import { GameState } from '@/core/GameState';
import { eventBus } from '@/core/EventBus';
import type { InputManager } from '@/core/input/InputManager';
import type { Screen } from './screens/Screen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { VehicleSelectScreen } from './screens/VehicleSelectScreen';
import { MapSelectScreen } from './screens/MapSelectScreen';
import { HUDScreen } from './screens/HUDScreen';
import { GameOverScreen } from './screens/GameOverScreen';

/**
 * Maps GameState -> which screen(s) are visible. Entirely decoupled from
 * gameplay: it only reacts to `game:state-changed` and only ever emits
 * `ui:*` intents — it never imports RunSession, PlayerVehicle, etc.
 * The HUD is layered on top during PLAYING and GAME_OVER so the crashed
 * frame stays visible behind the game-over card.
 */
export class UIManager {
  private screens: Partial<Record<GameState, Screen>>;
  private hud: HUDScreen;
  private currentMenuScreen: Screen | null = null;

  constructor(private root: HTMLElement, inputManager: InputManager) {
    this.screens = {
      [GameState.MAIN_MENU]: new MainMenuScreen(),
      [GameState.VEHICLE_SELECT]: new VehicleSelectScreen(),
      [GameState.MAP_SELECT]: new MapSelectScreen(),
      [GameState.GAME_OVER]: new GameOverScreen(),
    };
    this.hud = new HUDScreen(inputManager);
    this.root.appendChild(this.hud.element);
    this.hud.element.hidden = true;

    eventBus.on('game:state-changed', ({ state }) => this.showState(state as GameState));
  }

  private showState(state: GameState): void {
    if (this.currentMenuScreen) {
      this.currentMenuScreen.onHide?.();
      this.currentMenuScreen.element.remove();
      this.currentMenuScreen = null;
    }

    this.hud.element.hidden = !(state === GameState.PLAYING || state === GameState.GAME_OVER);

    const next = this.screens[state];
    if (next) {
      this.root.appendChild(next.element);
      next.onShow?.();
      this.currentMenuScreen = next;
    }
  }
}
