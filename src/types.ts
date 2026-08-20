export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: string;
  /** Consensus rank, lower is better. Overridden per-player via RankOverride. */
  rank: number;
  /** Bye week, if known. Not currently shown in the UI. */
  bye?: number;
  /** Average draft position from the source rankings. Not currently shown in the UI. */
  adp?: number;
  /** Overall (cross-position) tier grouping, lower is better. Undefined if not classified. */
  tier?: number;
  /** Tier grouping within this player's own position, lower is better. Undefined if not classified. */
  positionTier?: number;
}

/** A user's manual adjustment to a player's rank. Persisted in localStorage. */
export interface RankOverride {
  rank?: number;
}

export interface DraftConfig {
  teams: number;
  slot: number;
  rounds: number;
}

/** Maps a pick number (overall, 1-indexed) to the player drafted with that pick. */
export type Selections = Record<number, string | undefined>;

export interface SavedTeamPick {
  pick: number;
  /** Player details snapshotted at save time, so this stays accurate even if players.json changes later. */
  player: Pick<Player, "id" | "name" | "position" | "team">;
}

export interface SavedTeam {
  id: string;
  name: string;
  createdAt: string;
  config: DraftConfig;
  picks: SavedTeamPick[];
}

/** Player details snapshotted onto a tree node, so a tree stays valid even if players.json changes later. */
export type DraftTreePlayer = Pick<Player, "id" | "name" | "position" | "team">;

export interface DraftTreeNode {
  id: string;
  pick: number;
  player: DraftTreePlayer;
  /** Alternative continuations from this pick -- more than one child means this pick branches. */
  children: DraftTreeNode[];
}

export interface DraftTree {
  id: string;
  name: string;
  createdAt: string;
  /** Snapshotted at creation, so pick numbers stay consistent even if the live draft config changes later. */
  config: DraftConfig;
  /** Round-1 alternatives -- more than one root means you're comparing different Round-1 picks. */
  roots: DraftTreeNode[];
}

export type NoteColor = "yellow" | "blue" | "green" | "pink" | "purple" | "white";

/** A freeform sticky note on the Notes canvas. x/y are pixel offsets within the canvas. */
export interface Note {
  id: string;
  title: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
}
