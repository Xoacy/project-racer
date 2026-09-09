/** 1 = same direction as the player, -1 = oncoming (contraflow). */
export type TrafficDirection = 1 | -1;

export interface LaneGroup {
  direction: TrafficDirection;
  minLaneIndex: number;
  maxLaneIndex: number;
}

/**
 * Splits a map's per-lane direction array into contiguous same-direction
 * groups — e.g. [1,1,1,1] is one group spanning all 4 lanes ("mode 1");
 * [1,1,-1,-1] is a player-direction group (lanes 0-1) and an oncoming
 * group (lanes 2-3) ("mode 2"). This one array is what a map uses to
 * express which traffic mode it is — NpcDriver only ever car-follows,
 * checks lane-change safety, or picks a lane-change target within its own
 * group's [minLaneIndex, maxLaneIndex] range, so neither mode needs its
 * own branch anywhere in the AI: the grouping alone encodes the rule that
 * NPCs never cross into oncoming lanes.
 *
 * Same-direction lanes are assumed contiguous (true for both supported
 * modes) — a non-contiguous split (e.g. [1,-1,1,-1]) would need this
 * function generalized, which isn't needed by anything the game supports
 * today.
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
