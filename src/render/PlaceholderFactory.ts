import * as THREE from 'three';
import { createSurfaceMaterial } from './MaterialFactory';

/**
 * Builds stand-in box geometry for anything that doesn't have a glTF model
 * yet (all vehicles/obstacles/scenery during the step-1 skeleton). Once a
 * real model is assigned in a config's `modelPath`, AssetLoader uses that
 * instead and this factory is skipped for that entity.
 */
export function createPlaceholderBox(dims: {
  width: number;
  height: number;
  length: number;
  color: number;
}): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.length);
  const material = createSurfaceMaterial({ color: dims.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // Lift so the box sits on y=0 instead of being centered through the ground.
  mesh.position.y = dims.height / 2;
  return mesh;
}

export function createPlaceholderProp(color: number): THREE.Mesh {
  // Cheap variety for roadside scenery placeholders: a simple tapered box
  // (tree/pole/rock stand-in) rather than a plain cube.
  const height = 1.5 + Math.random() * 2.5;
  const geometry = new THREE.ConeGeometry(0.6 + Math.random() * 0.5, height, 5);
  const material = createSurfaceMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = height / 2;
  return mesh;
}
