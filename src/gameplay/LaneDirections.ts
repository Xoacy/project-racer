/** 1 = same direction as the player, -1 = oncoming (contraflow). */
export type TrafficDirection = 1 | -1;

/**
 * The menu of traffic-flow options a map can pick — this is the "Tipo de
 * Tráfego" a map's config chooses (see MapConfig.traffic.type). Adding a
 * new flow layout later (e.g. a reversible center lane) means adding one
 * case to `buildLaneDirections` below, not touching Track, TrafficSpawner,
 * or NpcDriver — they only ever consume the resulting per-lane array.
 */
export type TrafficType = 'one-way' | 'two-way';

export interface LaneGroup {
  direction: TrafficDirection;
  minLaneIndex: number;
  maxLaneIndex: number;
}

/**
 * Turns a map's chosen TrafficType into the per-lane direction array every
 * other system (Track, TrafficSpawner, NpcDriver) actually consumes. This
 * is the ONE place that convention is defined, so it can never drift
 * per-map the way a hand-authored array could:
 *
 * - 'one-way': every lane runs the same way as the player.
 * - 'two-way': lane index increases left-to-right (see PlayerVehicle's
 *   laneIndexToX), and the rule is fixed regardless of lane count — the
 *   left half is the oncoming/contraflow lanes, the right half is the
 *   player's own direction. For laneCount=4 that's lanes [0,1] oncoming,
 *   [2,3] the player's way.
 */
export function buildLaneDirections(type: TrafficType, laneCount: number): TrafficDirection[] {
  switch (type) {
    case 'one-way':
      return Array.from({ length: laneCount }, () => 1);
    case 'two-way': {
      const half = laneCount / 2;
      return Array.from({ length: laneCount }, (_, laneIndex) => (laneIndex < half ? -1 : 1));
    }
  }
}

/**
 * Splits a per-lane direction array (from buildLaneDirections) into
 * contiguous same-direction groups — e.g. [1,1,1,1] is one group spanning
 * all 4 lanes ('one-way'); [-1,-1,1,1] is an oncoming group (lanes 0-1)
 * and a player-direction group (lanes 2-3) ('two-way'). NpcDriver only
 * ever car-follows, checks lane-change safety, or picks a lane-change
 * target within its own group's [minLaneIndex, maxLaneIndex] range, so no
 * TrafficType needs its own branch anywhere in the AI: the grouping alone
 * encodes the rule that NPCs never cross into oncoming lanes.
 *
 * Same-direction lanes are assumed contiguous (true for every TrafficType
 * buildLaneDirections produces) — a non-contiguous split (e.g.
 * [1,-1,1,-1]) would need this function generalized, which isn't needed
 * by anything the game supports today.
 */
export function computeLaneGroups(laneDirections: readonly TrafficDirection[]): LaneGroup[] {
  const groups: LaneGroup[] = [];
  for (let i = 0; i < laneDirections.length; i++) {
    const direction = laneDirections[i];
    const current = groups[groups.length - 1];
    if (current && current.direction === direction) {
      current.maxLaneIndex = i;
    } else {
      groups.push({ direction, minLaneIndex: i, maxLaneIndex: i });
    }
  }
  return groups;
}

export function findLaneGroup(groups: LaneGroup[], laneIndex: number): LaneGroup {
  const group = groups.find((g) => laneIndex >= g.minLaneIndex && laneIndex <= g.maxLaneIndex);
  if (!group) throw new Error(`Lane index ${laneIndex} isn't covered by any lane group`);
  return group;
}
