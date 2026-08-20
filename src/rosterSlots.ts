import type { Player, Position, Selections } from "./types";

export type SlotLabel = "QB" | "RB" | "WR" | "TE" | "W/R/T" | "DST" | "K" | "BENCH";

/** Only the fields buildPositionalSlots actually needs -- satisfied by both a live Player and a SavedTeamPick's snapshot. */
export type PositionedPlayer = Pick<Player, "id" | "position">;

export interface RosterSlot {
  label: SlotLabel;
  playerId?: string;
  pick?: number;
}

interface SlotDef {
  label: SlotLabel;
  matches: (position: Position) => boolean;
}

/** Fixed starter lineup, in display order. Anything beyond this becomes bench. */
const STARTER_TEMPLATE: SlotDef[] = [
  { label: "QB", matches: (p) => p === "QB" },
  { label: "WR", matches: (p) => p === "WR" },
  { label: "WR", matches: (p) => p === "WR" },
  { label: "RB", matches: (p) => p === "RB" },
  { label: "RB", matches: (p) => p === "RB" },
  { label: "TE", matches: (p) => p === "TE" },
  { label: "W/R/T", matches: (p) => p === "RB" || p === "WR" || p === "TE" },
  { label: "DST", matches: (p) => p === "DST" },
  { label: "K", matches: (p) => p === "K" },
];

/**
 * Lays your picks out into a positional roster: the fixed starter slots above,
 * then one BENCH slot per remaining round. Drafted players fill the first open
 * slot matching their position, in the order they were actually drafted --
 * exact-position slots (including DST and K) fill before the flex slot, and
 * anything left over lands on the bench.
 */
export function buildPositionalSlots(
  myPicks: number[],
  selections: Selections,
  playersById: Record<string, PositionedPlayer>
): RosterSlot[] {
  const benchCount = Math.max(0, myPicks.length - STARTER_TEMPLATE.length);
  const working: (SlotDef & { playerId?: string; pick?: number })[] = [
    ...STARTER_TEMPLATE.map((slot) => ({ ...slot })),
    ...Array.from({ length: benchCount }, () => ({ label: "BENCH" as const, matches: () => true })),
  ];

  const draftedInOrder = myPicks
    .filter((pick) => selections[pick])
    .map((pick) => ({ pick, player: playersById[selections[pick]!] }))
    .filter((entry): entry is { pick: number; player: PositionedPlayer } => Boolean(entry.player))
    .sort((a, b) => a.pick - b.pick);

  for (const { pick, player } of draftedInOrder) {
    const slot =
      working.find((s) => !s.playerId && s.label !== "W/R/T" && s.label !== "BENCH" && s.matches(player.position)) ??
      working.find((s) => !s.playerId && s.label === "W/R/T" && s.matches(player.position)) ??
      working.find((s) => !s.playerId && s.label === "BENCH");
    if (slot) {
      slot.playerId = player.id;
      slot.pick = pick;
    }
  }

  return working.map(({ label, playerId, pick }) => ({ label, playerId, pick }));
}
