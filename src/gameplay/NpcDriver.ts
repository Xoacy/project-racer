import { clamp, moveTowards, randRange } from '@/utils/MathUtils';
import { NPC_TUNING } from '@/config/constants';
import type { TrafficDirection } from './LaneDirections';

/** A snapshot of another traffic vehicle's state, in the same scroll-space
 *  frame this NPC uses (see TrafficSpawner — z is anchored to the player,
 *  not an absolute world position, but relative gaps between any two
 *  vehicles sharing that frame are still physically correct). */
export interface NpcNeighbor {
  x: number;
  z: number;
  halfWidth: number;
  halfLength: number;
  speed: number;
  direction: TrafficDirection;
}

export interface NpcSpawnParams {
  laneCount: number;
  laneWidth: number;
  startLaneIndex: number;
  /** The contiguous range of lane indices this NPC's direction is allowed
   *  to occupy (see LaneDirections.ts) — lane-change candidates are
   *  clamped to this range, never crossing into a lane running the other
   *  way. For a "mode 1" map this is [0, laneCount-1]; for "mode 2" it's
   *  whichever half the NPC spawned into. */
  allowedLaneMin: number;
  allowedLaneMax: number;
  direction: TrafficDirection;
  cruiseSpeed: number;
  halfWidth: number;
  halfLength: number;
  z: number;
  /** Map-specific car-following/lane-change tuning — see
   *  MapConfig.traffic. */
  safeFollowSeconds: number;
  laneChangeChanceMin: number;
  laneChangeChanceMax: number;
}

/**
 * Pure AI logic for one traffic vehicle — no THREE.js objects. Mirrors the
 * split PlayerVehicle uses: TrafficSpawner reads `x`/`z` each frame to
 * position the THREE.Group; nothing in here touches rendering.
 *
 * Lateral position is continuous, exactly like the player's — an NPC's
 * "lane" is just which lane center its `targetX` currently points at, not
 * a slot it's locked into. Longitudinal speed follows the Intelligent
 * Driver Model (see NPC_TUNING.idm) for smooth, chainable car-following.
 *
 * `direction` (1 = same way as the player, -1 = oncoming) is what makes
 * one piece of logic serve both traffic modes: it flips the sign of this
 * NPC's contribution to the shared scroll-space z update (so oncoming
 * traffic closes the gap with the player at playerSpeed + its own speed,
 * a real head-on closing rate, not playerSpeed - speed), and every
 * lateral decision only ever considers/targets lanes within
 * [allowedLaneMin, allowedLaneMax] and neighbors sharing the same
 * direction — an NPC never car-follows, safety-checks against, or
 * lane-changes toward oncoming traffic.
 */
export class NpcDriver {
  x: number;
  z: number;
  speed: number;
  readonly halfWidth: number;
  readonly halfLength: number;
  readonly cruiseSpeed: number;
  readonly direction: TrafficDirection;

  private laneCount: number;
  private laneWidth: number;
  private laneIndex: number;
  private allowedLaneMin: number;
  private allowedLaneMax: number;
  private targetX: number;
  private lateralSpeed = 0;

  private timeHeadway: number;
  private laneChangeChanceMin: number;
  private laneChangeChanceMax: number;
  private laneChangeCheckTimer: number;
  /** Per-instance "personality": how eager this NPC is to change lanes
   *  when it does roll a decision check — randomized once at spawn so
   *  traffic doesn't all behave identically. */
  private laneChangeChance: number;

  constructor(params: NpcSpawnParams) {
    this.laneCount = params.laneCount;
    this.laneWidth = params.laneWidth;
    this.laneIndex = params.startLaneIndex;
    this.allowedLaneMin = params.allowedLaneMin;
    this.allowedLaneMax = params.allowedLaneMax;
    this.direction = params.direction;
    this.x = this.laneIndexToX(this.laneIndex);
    this.targetX = this.x;
    this.z = params.z;
    this.speed = params.cruiseSpeed;
    this.cruiseSpeed = params.cruiseSpeed;
    this.halfWidth = params.halfWidth;
    this.halfLength = params.halfLength;
    this.timeHeadway = params.safeFollowSeconds;
    this.laneChangeChanceMin = params.laneChangeChanceMin;
    this.laneChangeChanceMax = params.laneChangeChanceMax;
    this.laneChangeCheckTimer = randRange(
      NPC_TUNING.laneChange.checkIntervalMin,
      NPC_TUNING.laneChange.checkIntervalMax
    );
    this.laneChangeChance = randRange(this.laneChangeChanceMin, this.laneChangeChanceMax);
  }

  private laneIndexToX(laneIndex: number): number {
    return (laneIndex - (this.laneCount - 1) / 2) * this.laneWidth;
  }

  /** `neighbors` is every other active traffic vehicle (not this one, not
   *  the player). `playerSpeed` drives the shared scroll-space z update,
   *  same as every other scrolling system in the game. */
  update(dt: number, neighbors: NpcNeighbor[], playerSpeed: number): void {
    this.updateLaneChangeDecision(dt, neighbors);
    this.updateLateralMotion(dt);
    this.updateLongitudinalSpeed(dt, neighbors);
    // Same-direction traffic scrolls at (playerSpeed - ownSpeed), exactly
    // like before. Oncoming traffic is physically moving toward the
    // player, so its contribution flips sign: the gap closes at
    // (playerSpeed + ownSpeed) — a fast, real head-on closing rate.
    this.z += (playerSpeed - this.direction * this.speed) * dt;
  }

  /** Intelligent Driver Model: free-road acceleration toward cruiseSpeed,
   *  minus a braking term that grows sharply as the gap to whatever's
   *  ahead falls below the speed-dependent desired following distance.
   *  With no leader, the braking term is simply 0 — no branching needed. */
  private updateLongitudinalSpeed(dt: number, neighbors: NpcNeighbor[]): void {
    const { maxAcceleration, comfortableDeceleration, minGap, accelerationExponent } = NPC_TUNING.idm;
    const v = this.speed;

    let interactionTerm = 0;
    const leader = this.findLeader(neighbors);
    if (leader) {
      const distance = this.z - leader.z; // positive: leader is ahead (smaller z)
      const bumperGap = Math.max(0.1, distance - this.halfLength - leader.halfLength);
      const closingSpeed = v - leader.speed;
      const desiredGap =
        minGap +
        Math.max(0, v * this.timeHeadway + (v * closingSpeed) / (2 * Math.sqrt(maxAcceleration * comfortableDeceleration)));
      interactionTerm = (desiredGap / bumperGap) ** 2;
    }

    const freeRoadTerm = (v / this.cruiseSpeed) ** accelerationExponent;
    const acceleration = maxAcceleration * (1 - freeRoadTerm - interactionTerm);
    this.speed = Math.max(0, v + acceleration * dt);
  }

  /** Closest vehicle ahead of this one that overlaps its current lateral
   *  path (its own lane, or whichever lane(s) it's straddling mid-change)
   *  AND shares its direction — an NPC never tries to car-follow (match
   *  pace with) oncoming traffic, which wouldn't mean anything. */
  private findLeader(neighbors: NpcNeighbor[]): NpcNeighbor | null {
    let leader: NpcNeighbor | null = null;
    for (const n of neighbors) {
      if (n.direction !== this.direction) continue;
      if (!this.overlapsLaterally(n.x, n.halfWidth)) continue;
      if (n.z >= this.z) continue; // not ahead
      if (!leader || n.z > leader.z) leader = n;
    }
    return leader;
  }

  private overlapsLaterally(otherX: number, otherHalfWidth: number, atX = this.x): boolean {
    return Math.abs(otherX - atX) < this.halfWidth + otherHalfWidth + NPC_TUNING.lateralFollowMargin;
  }

  /** Occasionally rolls a decision to move to an adjacent lane within its
   *  own direction's range, but only once settled in the current one, and
   *  only if the target lane has a safe gap both ahead and behind at the
   *  moment of deciding. An unsafe attempt is simply skipped — the next
   *  random check will try again later, so a blocked NPC naturally waits
   *  for an opening instead of forcing its way in. */
  private updateLaneChangeDecision(dt: number, neighbors: NpcNeighbor[]): void {
    if (Math.abs(this.x - this.targetX) > NPC_TUNING.lateral.settledThreshold) return;

    this.laneChangeCheckTimer -= dt;
    if (this.laneChangeCheckTimer > 0) return;
    this.laneChangeCheckTimer = randRange(NPC_TUNING.laneChange.checkIntervalMin, NPC_TUNING.laneChange.checkIntervalMax);

    if (Math.random() > this.laneChangeChance) return;

    const step = Math.random() < 0.5 ? -1 : 1;
    const candidateLane = clamp(this.laneIndex + step, this.allowedLaneMin, this.allowedLaneMax);
    if (candidateLane === this.laneIndex) return; // already at the edge of its own direction's lanes

    if (!this.isLaneChangeSafe(candidateLane, neighbors)) return;

    this.laneIndex = candidateLane;
    this.targetX = this.laneIndexToX(this.laneIndex);
  }

  private isLaneChangeSafe(candidateLane: number, neighbors: NpcNeighbor[]): boolean {
    const candidateX = this.laneIndexToX(candidateLane);
    for (const n of neighbors) {
      if (n.direction !== this.direction) continue; // never relevant: candidate lanes never reach oncoming lanes
      if (!this.overlapsLaterally(n.x, n.halfWidth, candidateX)) continue;
      const bumperGap = Math.abs(this.z - n.z) - this.halfLength - n.halfLength;
      const requiredGap = n.z < this.z ? NPC_TUNING.laneChange.minGapAhead : NPC_TUNING.laneChange.minGapBehind;
      if (bumperGap < requiredGap) return false;
    }
    return true;
  }

  /** Eases x toward targetX with its own acceleration/deceleration curve
   *  (same style as the player's steering, minus the human input — the
   *  "input" here is just "go to targetX"), and hard-clamps on arrival so
   *  it settles cleanly instead of overshooting and correcting back. */
  private updateLateralMotion(dt: number): void {
    const { maxSpeed, acceleration, deceleration, approachGain } = NPC_TUNING.lateral;
    const dx = this.targetX - this.x;
    const desiredSpeed = Math.sign(dx) * Math.min(maxSpeed, Math.abs(dx) * approachGain);
    const rate = Math.abs(desiredSpeed) > Math.abs(this.lateralSpeed) ? acceleration : deceleration;
    this.lateralSpeed = moveTowards(this.lateralSpeed, desiredSpeed, rate * dt);

    const nextX = this.x + this.lateralSpeed * dt;
    const overshot = (dx > 0 && nextX > this.targetX) || (dx < 0 && nextX < this.targetX);
    if (overshot) {
      this.x = this.targetX;
      this.lateralSpeed = 0;
    } else {
      this.x = nextX;
    }
  }
}
