import { useMemo, useState } from "react";
import { POSITION_STYLES } from "../positionStyles";
import type { Player, Position, RankOverride } from "../types";

type SortKey = "rank" | "name" | "team" | "adp" | "bye";
type SortDirection = "asc" | "desc";

export const POSITIONS: (Position | "ALL")[] = ["ALL", "QB", "RB", "WR", "TE", "K", "DST"];

interface RankingsPanelProps {
  /** Players with overrides already merged in (effective rank). */
  players: Player[];
  onOverrideChange: (playerId: string, patch: RankOverride) => void;
  myPicks: number[];
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

type Row = { kind: "divider"; pick: number } | { kind: "player"; player: Player };

export function RankingsPanel({
  players,
  onOverrideChange,
  myPicks,
  draftedPlayerIds,
  impliedTakenIds,
  watchlistIds,
  armedPick,
  onPlayerClick,
  onDraftPlayer,
  onToggleWatchlist,
}: RankingsPanelProps) {
  const [positionFilter, setPositionFilter] = useState<Position | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...players];
    copy.sort((a, b) => {
      let cmp: number;
      switch (sortKey) {
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "adp":
          cmp = (a.adp ?? Infinity) - (b.adp ?? Infinity);
          break;
        case "bye":
          cmp = (a.bye ?? Infinity) - (b.bye ?? Infinity);
          break;
        case "team":
          cmp = a.team.localeCompare(b.team);
          break;
        default:
          cmp = a.name.localeCompare(b.name);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [players, sortKey, sortDirection]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sorted.filter(
      (p) => (positionFilter === "ALL" || p.position === positionFilter) && p.name.toLowerCase().includes(query)
    );
  }, [sorted, positionFilter, searchQuery]);

  // Pick dividers only make sense in the natural rank-ascending order.
  const showDividers = sortKey === "rank" && sortDirection === "asc";

  const rows = useMemo<Row[]>(() => {
    if (!showDividers) {
      return filtered.map((player) => ({ kind: "player", player }));
    }
    const out: Row[] = [];
    let pickIdx = 0;
    for (const player of filtered) {
      while (pickIdx < myPicks.length && myPicks[pickIdx] <= player.rank) {
        out.push({ kind: "divider", pick: myPicks[pickIdx] });
        pickIdx++;
      }
      out.push({ kind: "player", player });
    }
    while (pickIdx < myPicks.length) {
      out.push({ kind: "divider", pick: myPicks[pickIdx] });
      pickIdx++;
    }
    return out;
  }, [filtered, myPicks, showDividers]);

  return (
    <div className="flex h-full min-w-[640px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Rankings</h2>
        <div className="relative ml-4 w-48">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full rounded border border-slate-300 bg-white py-1 pl-2.5 pr-7 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as Position | "ALL")}
          className="ml-auto rounded border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos === "ALL" ? "All Positions" : pos}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Th label="Rank" width="w-20" active={sortKey === "rank"} direction={sortDirection} onClick={() => toggleSort("rank")} />
              <Th label="ADP" width="w-20" active={sortKey === "adp"} direction={sortDirection} onClick={() => toggleSort("adp")} />
              <Th label="Player" active={sortKey === "name"} direction={sortDirection} onClick={() => toggleSort("name")} />
              <th className="w-20 whitespace-nowrap border-b-2 border-slate-200 px-2 py-1">Pos</th>
              <Th label="Team" width="w-24" active={sortKey === "team"} direction={sortDirection} onClick={() => toggleSort("team")} />
              <Th label="Bye" width="w-20" active={sortKey === "bye"} direction={sortDirection} onClick={() => toggleSort("bye")} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.kind === "divider") {
                return (
                  <tr key={`divider-${row.pick}`}>
                    <td colSpan={6} className="bg-blue-600 px-2 py-1 text-center text-xs font-bold uppercase tracking-widest text-white">
                      Pick {row.pick}
                    </td>
                  </tr>
                );
              }

              const player = row.player;
              const isDrafted = draftedPlayerIds.has(player.id);
              const isImpliedTaken = !isDrafted && impliedTakenIds.has(player.id);
              const isTaken = isDrafted || isImpliedTaken;
              const isWatched = watchlistIds.has(player.id);
              const isSelected = selectedId === player.id;

              function handleRowClick() {
                if (isDrafted) {
                  onPlayerClick(player.id); // undo
                } else if (armedPick != null) {
                  onPlayerClick(player.id); // assign to the armed pick
                } else {
                  setSelectedId((prev) => (prev === player.id ? null : player.id)); // toggle Draft button
                }
              }

              return (
                <tr
                  key={player.id}
                  onClick={handleRowClick}
                  title={
                    isDrafted
                      ? "Click to undo this pick"
                      : isImpliedTaken
                        ? "Probably already taken -- click to draft anyway"
                        : armedPick != null
                          ? `Click to assign to pick ${armedPick}`
                          : "Click to draft this player"
                  }
                  className={`border-b border-slate-200 ${
                    isDrafted
                      ? "cursor-pointer bg-slate-50 opacity-50"
                      : isImpliedTaken
                        ? "cursor-pointer bg-slate-50 opacity-60 hover:opacity-80"
                        : isSelected
                          ? "cursor-pointer bg-blue-50 ring-1 ring-inset ring-blue-300"
                          : "cursor-pointer hover:bg-blue-50/60"
                  }`}
                >
                  <td className={`whitespace-nowrap px-2 py-1 ${isTaken ? "line-through" : ""}`}>
                    <input
                      type="number"
                      value={player.rank}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onOverrideChange(player.id, { rank: Number(e.target.value) })
                      }
                      className="no-spinner w-12 rounded px-1 py-0 font-bold tabular-nums text-slate-900 outline-none hover:bg-slate-100 focus:bg-blue-50 focus:ring-1 focus:ring-blue-600"
                    />
                  </td>
                  <td className={`whitespace-nowrap px-2 py-1 tabular-nums text-slate-500 ${isTaken ? "line-through" : ""}`}>
                    {player.adp != null ? player.adp.toFixed(1) : "—"}
                  </td>
                  <td className={`overflow-hidden px-2 py-1 font-semibold text-blue-900 ${isTaken ? "line-through" : ""}`}>
                    <span className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(player.id);
                        }}
                        title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                        className={`shrink-0 ${isWatched ? "text-amber-400" : "text-slate-300 hover:text-amber-400"}`}
                      >
                        {isWatched ? "★" : "☆"}
                      </button>
                      <span className="truncate">{player.name}</span>
                      {isSelected && !isDrafted && armedPick == null && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDraftPlayer(player.id);
                            setSelectedId(null);
                          }}
                          className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                        >
                          Draft
                        </button>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        isTaken ? "bg-slate-100 text-slate-400 line-through" : POSITION_STYLES[player.position]
                      }`}
                    >
                      {player.position}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-1 font-medium text-slate-500 ${isTaken ? "line-through" : ""}`}>
                    {player.team}
                  </td>
                  <td className={`whitespace-nowrap px-2 py-1 tabular-nums text-slate-500 ${isTaken ? "line-through" : ""}`}>
                    {player.bye ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  label,
  width,
  active,
  direction,
  onClick,
}: {
  label: string;
  width?: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none whitespace-nowrap border-b-2 border-slate-200 px-2 py-1 hover:text-slate-900 ${width ?? ""}`}
    >
      {label}
      {active && <span className="ml-1 text-blue-600">{direction === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}
