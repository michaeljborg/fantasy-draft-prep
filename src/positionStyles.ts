import type { HockeyRosterSlotLabel } from "./hockeyRosterSlots";
import type { SlotLabel } from "./rosterSlots";
import type { HockeyPosition, Position } from "./types";

/** Badge colors for each player position, used in the Rankings table's Pos column. */
export const POSITION_STYLES: Record<Position, string> = {
  QB: "bg-purple-50 text-purple-700",
  RB: "bg-blue-50 text-blue-700",
  WR: "bg-emerald-50 text-emerald-700",
  TE: "bg-orange-50 text-orange-700",
  K: "bg-amber-50 text-amber-700",
  DST: "bg-red-50 text-red-700",
};

/** Same badge colors, extended with the roster-slot labels used in the Positional view. */
export const SLOT_STYLES: Record<SlotLabel, string> = {
  ...POSITION_STYLES,
  "W/R/T": "bg-indigo-50 text-indigo-700",
  BENCH: "bg-slate-100 text-slate-500",
};

/** Badge colors for each hockey position, used in the Hockey Draft Board's Pos column. */
export const HOCKEY_POSITION_STYLES: Record<HockeyPosition, string> = {
  C: "bg-purple-50 text-purple-700",
  LW: "bg-emerald-50 text-emerald-700",
  RW: "bg-blue-50 text-blue-700",
  D: "bg-orange-50 text-orange-700",
  G: "bg-amber-50 text-amber-700",
};

/** Same badge colors, extended with the bench label used in the My Team panel. */
export const HOCKEY_SLOT_STYLES: Record<HockeyRosterSlotLabel, string> = {
  ...HOCKEY_POSITION_STYLES,
  BN: "bg-slate-100 text-slate-500",
};
