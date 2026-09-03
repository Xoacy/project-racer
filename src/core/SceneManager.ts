import * as THREE from 'three';

/**
 * Owns the renderer/scene/root camera and the resize/render-loop plumbing.
 * Gameplay and UI never touch THREE.WebGLRenderer directly — they add/remove
 * objects from `scene` and read/write `camera`.
 */
export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 400);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sunLight.position.set(-8, 15, 8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.sunLight.shadow.camera.far = 60;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  /** Applies a map's theme colors to sky/fog/lighting. Called once per run. */
  applyTheme(theme: { skyColor: number; fogColor: number; fogNear: number; fogFar: number }): void {
    this.scene.background = new THREE.Color(theme.skyColor);
    this.scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);
  }

  private handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
