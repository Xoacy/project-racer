import type { VehicleConfig } from '@/config/vehicles';
import type { MapConfig } from '@/config/maps';
import type { SceneManager } from '@/core/SceneManager';
import type { AssetLoader } from '@/core/AssetLoader';
import type { InputManager } from '@/core/input/InputManager';
import { PlayerVehicle } from './PlayerVehicle';
import { Track } from './Track';
import { TrafficSpawner } from './TrafficSpawner';
import { ScenerySpawner } from './ScenerySpawner';
import { CollisionSystem } from './CollisionSystem';
import { ScoreSystem } from './ScoreSystem';
import { DifficultyManager } from './DifficultyManager';
import { VehicleView } from '@/render/VehicleView';
import { CameraRig } from '@/render/CameraRig';
import { eventBus } from '@/core/EventBus';

/**
 * Owns one playthrough end-to-end: wires PlayerVehicle (logic) to
 * VehicleView (juice/presentation) and every world system, ticks them in
 * the right order each frame, and cleans up all scene objects on dispose.
 * Nothing outside this class (and Game, which owns its lifecycle) touches
 * these systems directly.
 */
export class RunSession {
  private player: PlayerVehicle;
  private track: Track;
  private traffic: TrafficSpawner;
  private scenery: ScenerySpawner;
  private collision = new CollisionSystem();
  private score = new ScoreSystem();
  private difficulty: DifficultyManager;
  private vehicleView: VehicleView;
  private cameraRig = new CameraRig();
  private vehicleMaxSpeed: number;

  private ended = false;

  constructor(
    private sceneManager: SceneManager,
    assetLoader: AssetLoader,
    private inputManager: InputManager,
    vehicleConfig: VehicleConfig,
    mapConfig: MapConfig
  ) {
    this.vehicleMaxSpeed = vehicleConfig.physics.maxSpeed;
    this.sceneManager.applyTheme(mapConfig.theme);

    this.player = new PlayerVehicle(vehicleConfig, mapConfig);
    this.track = new Track(mapConfig);
    this.traffic = new TrafficSpawner(mapConfig);
    this.scenery = new ScenerySpawner(mapConfig, this.track.roadHalfWidth);
    this.difficulty = new DifficultyManager(mapConfig);
    this.vehicleView = new VehicleView(assetLoader, vehicleConfig);

    this.sceneManager.scene.add(this.track.root);
    this.sceneManager.scene.add(this.traffic.root);
    this.sceneManager.scene.add(this.scenery.root);
    this.sceneManager.scene.add(this.vehicleView.root);

    eventBus.emit('game:run-started', { vehicleId: vehicleConfig.id, mapId: mapConfig.id });
  }

  /** Returns true once per run, the frame a collision ends it. */
  update(dt: number): boolean {
    if (this.ended) return false;

    this.difficulty.update(dt);

    const lateralInput = this.inputManager.getLateralInput();
    const braking = this.inputManager.isBraking();
    const targetSpeed = this.difficulty.getTargetSpeed(this.vehicleMaxSpeed);

    this.player.update(dt, lateralInput, braking, targetSpeed);
    const state = this.player.getState();

    this.track.update(dt, state.speed);
    this.traffic.update(dt, state.speed, this.difficulty.getTrafficIntervalFactor());
    this.scenery.update(dt, state.speed);

    this.vehicleView.update(dt, state);
    this.cameraRig.update(dt, this.sceneManager.camera, state);

    this.score.update(state.distanceTraveled);
    eventBus.emit('game:score-changed', { score: this.score.getScore(), distanceMeters: state.distanceTraveled });
    eventBus.emit('game:speed-changed', {
      speedKmh: state.speed * 3.6,
      speedRatio: state.speed / state.maxSpeed,
    });

    const playerHalfWidth = this.player.dimensions.width / 2;
    const playerHalfLength = this.player.dimensions.length / 2;
    if (this.collision.check(state, playerHalfWidth, playerHalfLength, this.traffic.getActive())) {
      this.ended = true;
      eventBus.emit('game:collision', { atDistanceMeters: state.distanceTraveled });
      const isNewHighScore = ScoreSystem.commitIfHighScore(this.score.getScore());
      eventBus.emit('game:run-ended', {
        score: this.score.getScore(),
        distanceMeters: state.distanceTraveled,
        isNewHighScore,
      });
      return true;
    }

    return false;
  }

  dispose(): void {
    this.sceneManager.scene.remove(this.track.root);
    this.sceneManager.scene.remove(this.traffic.root);
    this.sceneManager.scene.remove(this.scenery.root);
    this.sceneManager.scene.remove(this.vehicleView.root);
    this.track.dispose();
    this.traffic.dispose();
    this.scenery.dispose();
    this.vehicleView.dispose();
    this.sceneManager.scene.fog = null;
  }
}
