import { useEffect, useMemo, useRef, useState } from "react";
import { POSITION_STYLES } from "../positionStyles";
import { POSITIONS, Th } from "./RankingsPanel";
import type { Player, Position } from "../types";

type SortKey = "rank" | "name" | "team" | "adp" | "bye";
type SortDirection = "asc" | "desc";

type Row = { kind: "divider"; pick: number; isTarget: boolean } | { kind: "player"; player: Player };

interface TreePlayerBoardProps {
  players: Player[];
  /** All of your picks for this tree's draft config, used to render "Pick N" dividers. */
  myPicks: number[];
  /** Players already used earlier in this specific path -- shown but not selectable. */
  excludeIds: Set<string>;
  /** The pick this selection is actually for, so its divider can be highlighted and scrolled to. */
  targetPick?: number;
  title: string;
  onSelect: (player: Player) => void;
  onClose: () => void;
}

/**
 * The Draft Tree's player picker: the same scrollable, sortable, searchable
 * board as the live Rankings table (with "Pick N" divider bars for this
 * tree's own picks), so you can browse the whole player pool with context
 * instead of just typing a name into a small search box.
 */
export function TreePlayerBoard({ players, myPicks, excludeIds, targetPick, title, onSelect, onClose }: TreePlayerBoardProps) {
  const [positionFilter, setPositionFilter] = useState<Position | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const targetRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    // Only on mount -- once you've scrolled around we shouldn't yank you back.
    targetRowRef.current?.scrollIntoView({ block: "center" });
  }, []);

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
        out.push({ kind: "divider", pick: myPicks[pickIdx], isTarget: myPicks[pickIdx] === targetPick });
        pickIdx++;
      }
      out.push({ kind: "player", player });
    }
    while (pickIdx < myPicks.length) {
      out.push({ kind: "divider", pick: myPicks[pickIdx], isTarget: myPicks[pickIdx] === targetPick });
      pickIdx++;
    }
    return out;
  }, [filtered, myPicks, showDividers, targetPick]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6" onClick={onClose}>
      <div
        className="flex h-full max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">{title}</h2>
          <div className="relative ml-4 w-48">
            <input
              type="text"
              autoFocus
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
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos === "ALL" ? "All Positions" : pos}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
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
                    <tr key={`divider-${row.pick}`} ref={row.isTarget ? targetRowRef : undefined}>
                      <td
                        colSpan={6}
                        className={`px-2 py-1 text-center text-xs font-bold uppercase tracking-widest text-white ${
                          row.isTarget ? "bg-emerald-600" : "bg-blue-600"
                        }`}
                      >
                        Pick {row.pick}
                        {row.isTarget ? " · This Pick" : ""}
                      </td>
                    </tr>
                  );
                }

                const player = row.player;
                const isExcluded = excludeIds.has(player.id);

                return (
                  <tr
                    key={player.id}
                    onClick={() => {
                      if (isExcluded) return;
                      onSelect(player);
                      onClose();
                    }}
                    title={isExcluded ? "Already used earlier in this path" : "Click to select"}
                    className={`border-b border-slate-200 ${
                      isExcluded ? "cursor-not-allowed bg-slate-50 text-slate-300" : "cursor-pointer hover:bg-blue-50/60"
                    }`}
                  >
                    <td className={`whitespace-nowrap px-2 py-1 font-bold tabular-nums ${isExcluded ? "" : "text-slate-900"}`}>
                      {player.rank}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1 tabular-nums text-slate-500">
                      {player.adp != null ? player.adp.toFixed(1) : "—"}
                    </td>
                    <td className={`overflow-hidden px-2 py-1 font-semibold ${isExcluded ? "" : "text-blue-900"}`}>
                      <span className="block truncate">{player.name}</span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                          isExcluded ? "bg-slate-100 text-slate-400" : POSITION_STYLES[player.position]
                        }`}
                      >
                        {player.position}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1 font-medium text-slate-500">{player.team}</td>
                    <td className="whitespace-nowrap px-2 py-1 tabular-nums text-slate-500">{player.bye ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
