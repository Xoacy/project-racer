import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Wraps GLTFLoader with caching. This is the pipeline seam for step 3
 * (Blender -> glTF -> Three.js validation): point a VehicleConfig's
 * `modelPath` at a file under /public/models and it loads here instead of
 * falling back to a placeholder box.
 */
export class AssetLoader {
  private loader = new GLTFLoader();
  private cache = new Map<string, THREE.Group>();
  private inFlight = new Map<string, Promise<THREE.Group | null>>();

  /** Returns a fresh clone of the loaded model, or null if no path is given
   *  or loading fails (caller should fall back to a placeholder). */
  async loadModel(path: string | undefined): Promise<THREE.Group | null> {
    if (!path) return null;

    const cached = this.cache.get(path);
    if (cached) return cached.clone(true);

    let pending = this.inFlight.get(path);
    if (!pending) {
      pending = this.loader
        .loadAsync(path)
        .then((gltf) => {
          this.cache.set(path, gltf.scene);
          return gltf.scene;
        })
        .catch((err) => {
          console.warn(`[AssetLoader] Failed to load "${path}", using placeholder.`, err);
          return null;
        })
        .finally(() => {
          this.inFlight.delete(path);
        });
      this.inFlight.set(path, pending);
    }

    const scene = await pending;
    return scene ? scene.clone(true) : null;
  }
}
