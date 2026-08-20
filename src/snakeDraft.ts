import type { DraftConfig } from "./types";

/**
 * Given a snake draft (odd rounds go 1..teams, even rounds reverse), returns
 * the overall pick numbers (1-indexed) belonging to the given slot.
 *
 * e.g. teams=12, slot=6, rounds=4 -> [6, 19, 30, 43]
 */
export function getMyPicks({ teams, slot, rounds }: DraftConfig): number[] {
  const picks: number[] = [];
  for (let round = 1; round <= rounds; round++) {
    const isEvenRound = round % 2 === 0;
    const pickInRound = isEvenRound ? teams - slot + 1 : slot;
    picks.push((round - 1) * teams + pickInRound);
  }
  return picks;
}
