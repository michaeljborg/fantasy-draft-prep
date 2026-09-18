import type { HockeyPlayer, HockeyPosition } from "./types";

export type HockeyRosterSlotLabel = HockeyPosition | "BN";

/** Fixed roster template, in display order. Anything beyond the starter slots is bench. */
export const HOCKEY_ROSTER_TEMPLATE: HockeyRosterSlotLabel[] = [
  "C",
  "C",
  "LW",
  "LW",
  "RW",
  "RW",
  "D",
  "D",
  "D",
  "D",
  "G",
  "G",
  "BN",
  "BN",
  "BN",
  "BN",
];

export interface HockeyRosterSlot {
  label: HockeyRosterSlotLabel;
  playerId?: string;
}

type PositionedPlayer = Pick<HockeyPlayer, "id" | "positions">;

/**
 * Lays players onto the fixed roster template above, in the order given (keepers
 * first, then drafted picks in draft order). Each player fills the first open slot
 * matching one of their eligible positions; anything left over lands on the bench.
 *
 * `slotOverrides` lets a dual-eligible player be pinned to a specific slot label
 * (e.g. moving a C/RW player onto RW for viewing) -- honored whenever that label is
 * one of the player's eligible positions (or "BN") and a slot with it is still open,
 * otherwise the default first-open-slot placement above applies.
 */
export function buildHockeyRosterSlots(
  playerIdsInOrder: string[],
  playersById: Record<string, PositionedPlayer>,
  slotOverrides: Partial<Record<string, HockeyRosterSlotLabel>> = {}
): HockeyRosterSlot[] {
  const working: HockeyRosterSlot[] = HOCKEY_ROSTER_TEMPLATE.map((label) => ({ label }));

  for (const id of playerIdsInOrder) {
    const player = playersById[id];
    if (!player) continue;
    const preferred = slotOverrides[id];
    const preferredIsEligible = preferred === "BN" || (preferred != null && player.positions.includes(preferred));

    const slot =
      (preferredIsEligible ? working.find((s) => !s.playerId && s.label === preferred) : undefined) ??
      working.find((s) => !s.playerId && s.label !== "BN" && player.positions.includes(s.label as HockeyPosition)) ??
      working.find((s) => !s.playerId && s.label === "BN");
    if (slot) slot.playerId = id;
  }

  return working;
}
