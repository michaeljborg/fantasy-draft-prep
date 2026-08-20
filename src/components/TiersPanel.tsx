import { useMemo, useState } from "react";
import { POSITION_STYLES } from "../positionStyles";
import { POSITIONS } from "./RankingsPanel";
import type { Player, Position } from "../types";

interface TiersPanelProps {
  players: Player[];
  draftedPlayerIds: Set<string>;
  /** Players ranked at or better than your worst actual pick, presumed taken by other teams. */
  impliedTakenIds: Set<string>;
  watchlistIds: Set<string>;
  armedPick: number | null;
  onPlayerClick: (playerId: string) => void;
  /** Draft a player straight to your next open pick, without arming one first. */
  onDraftPlayer: (playerId: string) => void;
  onToggleWatchlist: (playerId: string) => void;
}

export function TiersPanel({
  players,
  draftedPlayerIds,
  impliedTakenIds,
  watchlistIds,
  armedPick,
  onPlayerClick,
  onDraftPlayer,
  onToggleWatchlist,
}: TiersPanelProps) {
  const [positionFilter, setPositionFilter] = useState<Position | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (positionFilter === "ALL" ? players : players.filter((p) => p.position === positionFilter)),
    [players, positionFilter]
  );

  // "All Positions" uses the overall cross-position tier; a single position uses that
  // position's own tier scale (a different, more granular set of tier numbers).
  const tierField = positionFilter === "ALL" ? "tier" : "positionTier";

  const { tiers, unranked } = useMemo(() => {
    const byTier = new Map<number, Player[]>();
    const noTier: Player[] = [];
    for (const p of filtered) {
      const t = p[tierField];
      if (t == null) {
        noTier.push(p);
      } else {
        if (!byTier.has(t)) byTier.set(t, []);
        byTier.get(t)!.push(p);
      }
    }
    for (const list of byTier.values()) list.sort((a, b) => a.rank - b.rank);
    noTier.sort((a, b) => a.rank - b.rank);
    return { tiers: [...byTier.entries()].sort((a, b) => a[0] - b[0]), unranked: noTier };
  }, [filtered, tierField]);

  function renderRow(player: Player) {
    const isDrafted = draftedPlayerIds.has(player.id);
    return (
      <PlayerRow
        key={player.id}
        player={player}
        isDrafted={isDrafted}
        isImpliedTaken={!isDrafted && impliedTakenIds.has(player.id)}
        isWatched={watchlistIds.has(player.id)}
        isSelected={selectedId === player.id}
        armedPick={armedPick}
        onClick={() => {
          if (isDrafted || armedPick != null) {
            onPlayerClick(player.id);
          } else {
            setSelectedId((prev) => (prev === player.id ? null : player.id));
          }
        }}
        onDraft={() => {
          onDraftPlayer(player.id);
          setSelectedId(null);
        }}
        onToggleWatchlist={() => onToggleWatchlist(player.id)}
      />
    );
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Tiers</h2>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as Position | "ALL")}
          className="ml-auto rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos === "ALL" ? "All Positions" : pos}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tiers.map(([tier, list]) => (
          <div key={tier}>
            <div className="bg-blue-600 px-3 py-1 text-center text-xs font-bold uppercase tracking-widest text-white">
              Tier {tier}
            </div>
            <ul>{list.map(renderRow)}</ul>
          </div>
        ))}

        {unranked.length > 0 && (
          <div>
            <div className="bg-slate-200 px-3 py-1 text-center text-xs font-bold uppercase tracking-widest text-slate-600">
              Unranked
            </div>
            <ul>{unranked.map(renderRow)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

export interface PlayerRowProps {
  player: Player;
  isDrafted: boolean;
  isImpliedTaken: boolean;
  isWatched: boolean;
  isSelected: boolean;
  armedPick: number | null;
  onClick: () => void;
  onDraft: () => void;
  onToggleWatchlist: () => void;
}

export function PlayerRow({
  player,
  isDrafted,
  isImpliedTaken,
  isWatched,
  isSelected,
  armedPick,
  onClick,
  onDraft,
  onToggleWatchlist,
}: PlayerRowProps) {
  return (
    <li
      onClick={onClick}
      title={
        isDrafted
          ? "Click to undo this pick"
          : isImpliedTaken
            ? "Probably already taken -- click to draft anyway"
            : armedPick != null
              ? `Click to assign to pick ${armedPick}`
              : "Click to draft this player"
      }
      className={`flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-sm ${
        isDrafted
          ? "cursor-pointer bg-slate-50 opacity-50"
          : isImpliedTaken
            ? "cursor-pointer bg-slate-50 opacity-60 hover:opacity-80"
            : isSelected
              ? "cursor-pointer bg-blue-50 ring-1 ring-inset ring-blue-300"
              : "cursor-pointer hover:bg-blue-50/60"
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist();
          }}
          title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
          className={`shrink-0 ${isWatched ? "text-amber-400" : "text-slate-300 hover:text-amber-400"}`}
        >
          {isWatched ? "★" : "☆"}
        </button>
        <span
          className={`flex min-w-0 items-center gap-2 truncate font-semibold text-blue-900 ${
            isDrafted || isImpliedTaken ? "line-through" : ""
          }`}
        >
          <span className="truncate">{player.name}</span>
          {isSelected && !isDrafted && armedPick == null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDraft();
              }}
              className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              Draft
            </button>
          )}
        </span>
      </span>
      <span
        className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
          isDrafted || isImpliedTaken ? "bg-slate-100 text-slate-400 line-through" : POSITION_STYLES[player.position]
        }`}
      >
        {player.position}
      </span>
    </li>
  );
}
