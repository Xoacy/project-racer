/** A single lane-change request: -1 = left, 1 = right. Sources push these
 *  into InputManager; gameplay consumes them edge-triggered (once each). */
export type LaneDirection = -1 | 1;

export interface InputSource {
  attach(): void;
  detach(): void;
}
