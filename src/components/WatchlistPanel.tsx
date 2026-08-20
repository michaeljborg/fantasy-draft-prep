import { useMemo, useState } from "react";
import { PlayerRow } from "./TiersPanel";
import { POSITIONS } from "./RankingsPanel";
import type { Player, Position } from "../types";

interface WatchlistPanelProps {
  players: Player[];
  watchlistIds: Set<string>;
  draftedPlayerIds: Set<string>;
  impliedTakenIds: Set<string>;
  armedPick: number | null;
  onPlayerClick: (playerId: string) => void;
  onDraftPlayer: (playerId: string) => void;
  onToggleWatchlist: (playerId: string) => void;
}

export function WatchlistPanel({
  players,
  watchlistIds,
  draftedPlayerIds,
  impliedTakenIds,
  armedPick,
  onPlayerClick,
  onDraftPlayer,
  onToggleWatchlist,
}: WatchlistPanelProps) {
  const [positionFilter, setPositionFilter] = useState<Position | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const watched = useMemo(() => {
    return players
      .filter((p) => watchlistIds.has(p.id) && (positionFilter === "ALL" || p.position === positionFilter))
      .sort((a, b) => a.rank - b.rank);
  }, [players, watchlistIds, positionFilter]);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Watchlist</h2>
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
        {watched.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
          </div>
        ) : (
          <ul>
            {watched.map((player) => {
              const isDrafted = draftedPlayerIds.has(player.id);
              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isDrafted={isDrafted}
                  isImpliedTaken={!isDrafted && impliedTakenIds.has(player.id)}
                  isWatched
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
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
