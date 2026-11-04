# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # tsc -b (typecheck) + vite build -> dist/
npm run preview   # serve the production build
npx tsc --noEmit  # typecheck only, no build
```

No test runner, linter, or formatter is configured. `npm run build` is the only verification available; TypeScript is `strict` with `noUnusedLocals`/`noUnusedParameters`, so unused code fails the build.

Deploy/base path is relative (`base: './'`) because the build will be wrapped by Capacitor for Android.

## Architecture

Three layers with a strict dependency direction. Violating it is the main way to break this codebase.

```
config/      pure data, imports nothing from gameplay/render/ui
gameplay/    pure logic: numbers and rules; no UI knowledge (THREE types only where a
             scene object must be passed in/out, e.g. TrafficInstance.group)
render/      presentation; may read gameplay/types.ts snapshots, never writes gameplay state
ui/          menus; talks to gameplay ONLY through EventBus
core/        orchestration; Game.ts is the only class importing both ui/ and gameplay/
```

- `config/` → `gameplay/` → `render/`: data flows down, presentation reads up. `render/VehicleView.ts` reads `PlayerState` snapshots and never writes back — body roll/pitch now come from the suspension simulation, so visuals can't alter hitboxes or scoring.
- UI ↔ gameplay crosses only via `eventBus` (`ui:*` intents, `game:*` notifications), typed in `src/core/EventBus.ts`. Add new cross-layer messages to that interface, not by direct imports.
- Every per-run system lives in `src/gameplay/RunSession.ts`: it constructs, ticks in a fixed order (difficulty → player → track/traffic/scenery → vehicle view/skid marks/speed lines/camera → score → collision), and disposes Track/TrafficSpawner/ScenerySpawner/PlayerVehicle/VehicleView/SkidMarks/SpeedLines/CameraRig. `Game.ts` owns the state machine (`GameState`) and the rAF loop; `MAX_DT = 1/20` clamps frame gaps. A collision (checked last, in `CollisionSystem`, axis-aligned in the player's yaw frame) ends the run, commits the high score to `localStorage`, and emits `game:run-ended`.
- `src/ui/UIManager.ts` maps `GameState` to screens and layers the HUD on top during PLAYING/GAME_OVER (so the crashed frame stays visible). It only reacts to `game:*` and emits `ui:*`.
- Input goes through `core/input/InputManager`, which aggregates `KeyboardSource`/`TouchSource`/`TiltSource` into analog steering `[-1, 1]`, throttle/brake `[0, 1]` and handbrake. Gameplay only reads `InputManager`; add a control scheme as a new `InputSource`. Steering sensitivity (0.6–1.4) is a main-menu slider persisted in `localStorage` and applied in `getLateralInput()`. Tilt exists but is off by default; the HUD drives touch buttons through `inputManager.touchControls`.
- Player physics is four-wheel: `PlayerVehicle` owns wheel state and integrates tire forces from `gameplay/vehicle/TireModel.ts`, per-corner loads from `gameplay/vehicle/Suspension.ts`, and torque/gearbox from `gameplay/vehicle/Powertrain.ts` at fixed substeps. Speed comes from those forces, not from a difficulty target — do not reintroduce auto-acceleration.
- "Maps" are the traffic-flow layout chosen per map (`MapConfig.traffic.type`, `'one-way' | 'two-way'`), not a global mode. `buildLaneDirections` owns the fixed convention: left half of lanes is oncoming in two-way. NPCs are confined to their own contiguous lane group; the player may cross into oncoming lanes deliberately.

## World / coordinate conventions

- Units are meters; car faces `-Z`; camera sits behind at `+Z`. Player is fixed at `z = 0` and the world scrolls instead (traffic spawns at `z = -140`, culled at `+12`).
- Lateral position `x` is free and continuous across the road width — no lane snapping. Lanes are a visual reference only; `MapConfig.lanes.count` is always 4 (validated at module load in `src/config/maps/index.ts`).
- Traffic direction comes solely from `gameplay/LaneDirections.ts`: `buildLaneDirections(traffic.type, count)` maps each lane to ±1, `computeLaneGroups` splits contiguous same-direction groups. `Track`, `TrafficSpawner`, and `NpcDriver` consume the result — do not add per-map direction arrays or "mode" branches elsewhere.

## Data-driven content

Adding a vehicle or map is a config-only change: create one file satisfying `VehicleConfig` / `MapConfig` (`src/config/*/types.ts`) and register it in the matching `index.ts` array. The UI select screens and gameplay consume the registries.

- All tune-by-feel numbers live in `src/config/constants.ts`, grouped by system (`JUICE_TUNING`, `VEHICLE_SIM_TUNING`, `SKID_TUNING`, `SPEED_LINES_TUNING`, `DIFFICULTY_CURVE`, `SCORE_TUNING`, `NPC_TUNING`, `WORLD`). Per-map knobs live in `MapConfig`; do not hardcode tuning values inside logic.
- Models: point `VehicleConfig.modelPath` at a `.glb` under `public/models/`; `AssetLoader` loads/caches and `VehicleView` swaps out the placeholder when ready. If loading fails or no path is set, the placeholder box stays. Export convention (baked into the file, not corrected in code): forward is `-Z`, origin centered at the wheelbase bottom, real-world meters — see `public/models/README.md`.

## Contribution practices

Follow the conventions established in this repo's history (there is no CONTRIBUTING.md):

- **Commits:** English, lowercase Conventional Commits summary — `feat:`, `fix:`, `tune:`, `docs:` — imperative, no trailing period. Keep the message short: a couple of lines at most, no long explanatory body. End with the `Co-Authored-By:` line for the Claude model used.
- **Comments:** do not add comments to code unless strictly necessary to explain a non-obvious constraint. No comment blocks, no restating what the code does. (Existing comments are legacy; don't match their style.)
- **Docs:** `README.md` and `public/models/README.md` are written in Portuguese.
- **Versioning:** every `feat:`/`fix:`/`tune:` commit bumps `package.json` (minor for features, patch for fixes/tuning) and is tagged `vX.Y.Z` on the same commit. `docs:`-only commits do not bump. Keep `package-lock.json` in sync (`npm install --package-lock-only`).
- **Verification:** `npm run build` must pass (strict TS). UI/visual changes are checked in a headless Chromium run before committing. There is no test suite to run.
- **Scope:** keep each commit to one behavior change. Visual-only changes must leave gameplay/collision/scoring untouched — the layer split exists so this stays true.

## Path alias

`@/` → `src/` is configured in both `vite.config.ts` and `tsconfig.json`. Keep them in sync if changing it.

## Versioning

SemVer in `package.json`; `1.0.0` is reserved for the finished game and is not tied to a technical milestone.
