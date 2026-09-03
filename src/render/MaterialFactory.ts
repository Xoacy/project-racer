import * as THREE from 'three';

/**
 * Single choke point for "how do surfaces get shaded". The shading approach
 * (solid flat-shaded vertex color vs. low-poly + simple textures) is not
 * decided yet — when it is, change SHADING_MODE and the two branches below,
 * nothing else in the codebase creates materials directly.
 */
export type ShadingMode = 'flat' | 'textured';

export const SHADING_MODE: ShadingMode = 'flat';

const textureCache = new Map<string, THREE.Texture>();
const textureLoader = new THREE.TextureLoader();

export function createSurfaceMaterial(opts: {
  color: number;
  texturePath?: string;
}): THREE.Material {
  if (SHADING_MODE === 'textured' && opts.texturePath) {
    let tex = textureCache.get(opts.texturePath);
    if (!tex) {
      tex = textureLoader.load(opts.texturePath);
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(opts.texturePath, tex);
    }
    return new THREE.MeshLambertMaterial({ map: tex });
  }

  // Flat-shaded low-poly look: no textures, faceted normals via flatShading.
  return new THREE.MeshLambertMaterial({ color: opts.color, flatShading: true });
}

export function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    const anyMat = mat as any;
    if (anyMat.map) anyMat.map.dispose();
    mat.dispose();
  }
}
