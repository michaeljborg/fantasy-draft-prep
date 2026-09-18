import { useMemo, useState } from "react";
import { HOCKEY_POSITION_STYLES } from "../positionStyles";
import type { HockeyPlayer } from "../types";
import { Th } from "./RankingsPanel";

type ViewMode = "skaters" | "goalies";

type SortKey =
  | "preSeason"
  | "current"
  | "name"
  | "team"
  | "gp"
  | "fanPts"
  | "goals"
  | "assists"
  | "plusMinus"
  | "ppp"
  | "sog"
  | "hits"
  | "blocks"
  | "wins"
  | "goalsAgainst"
  | "saves"
  | "shutouts";
type SortDirection = "asc" | "desc";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "skaters", label: "Skaters" },
  { key: "goalies", label: "Goalies" },
];

interface HockeyDraftBoardProps {
  players: HockeyPlayer[];
  myTeamName: string;
  draftedByMeIds: Set<string>;
  takenByOthersIds: Set<string>;
  isRosterFull: boolean;
  nextPickIsMine: boolean;
  onDraftPlayer: (playerId: string) => void;
  onUndoDraft: (playerId: string) => void;
}

export function HockeyDraftBoard({
  players,
  myTeamName,
  draftedByMeIds,
  takenByOthersIds,
  isRosterFull,
  nextPickIsMine,
  onDraftPlayer,
  onUndoDraft,
}: HockeyDraftBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("skaters");
  const [sortKey, setSortKey] = useState<SortKey>("preSeason");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");

  function changeView(mode: ViewMode) {
    setViewMode(mode);
    setSortKey("preSeason");
    setSortDirection("asc");
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const scoped = useMemo(
    () => players.filter((p) => (viewMode === "skaters" ? p.kind === "skater" : p.kind === "goalie")),
    [players, viewMode]
  );

  const sorted = useMemo(() => {
    const copy = [...scoped];
    copy.sort((a, b) => {
      let cmp: number;
      switch (sortKey) {
        case "preSeason":
          cmp = a.rankPreSeason - b.rankPreSeason;
          break;
        case "current":
          cmp = a.rankCurrent - b.rankCurrent;
          break;
        case "team":
          cmp = a.team.localeCompare(b.team);
          break;
        case "gp":
          cmp = a.gamesPlayed - b.gamesPlayed;
          break;
        case "fanPts":
          cmp = a.fantasyPoints - b.fantasyPoints;
          break;
        case "goals":
          cmp = (a.kind === "skater" ? a.goals : 0) - (b.kind === "skater" ? b.goals : 0);
          break;
        case "assists":
          cmp = (a.kind === "skater" ? a.assists : 0) - (b.kind === "skater" ? b.assists : 0);
          break;
        case "plusMinus":
          cmp = (a.kind === "skater" ? a.plusMinus : 0) - (b.kind === "skater" ? b.plusMinus : 0);
          break;
        case "ppp":
          cmp = (a.kind === "skater" ? a.powerPlayPoints : 0) - (b.kind === "skater" ? b.powerPlayPoints : 0);
          break;
        case "sog":
          cmp = (a.kind === "skater" ? a.shotsOnGoal : 0) - (b.kind === "skater" ? b.shotsOnGoal : 0);
          break;
        case "hits":
          cmp = (a.kind === "skater" ? a.hits : 0) - (b.kind === "skater" ? b.hits : 0);
          break;
        case "blocks":
          cmp = (a.kind === "skater" ? a.blocks : 0) - (b.kind === "skater" ? b.blocks : 0);
          break;
        case "wins":
          cmp = (a.kind === "goalie" ? a.wins : 0) - (b.kind === "goalie" ? b.wins : 0);
          break;
        case "goalsAgainst":
          cmp = (a.kind === "goalie" ? a.goalsAgainst : 0) - (b.kind === "goalie" ? b.goalsAgainst : 0);
          break;
        case "saves":
          cmp = (a.kind === "goalie" ? a.saves : 0) - (b.kind === "goalie" ? b.saves : 0);
          break;
        case "shutouts":
          cmp = (a.kind === "goalie" ? a.shutouts : 0) - (b.kind === "goalie" ? b.shutouts : 0);
          break;
        default:
          cmp = a.name.localeCompare(b.name);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [scoped, sortKey, sortDirection]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((p) => p.name.toLowerCase().includes(query));
  }, [sorted, searchQuery]);

  const keeperCount = useMemo(() => players.filter((p) => p.rosterStatus === myTeamName).length, [players, myTeamName]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Draft Board</h2>
        <div className="ml-2 flex rounded-md bg-slate-100 p-0.5">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => changeView(mode.key)}
              className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                viewMode === mode.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="relative ml-2 w-48">
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
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} players · {keeperCount}/3 of your keepers shown
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Th label="Pre" width="w-14" active={sortKey === "preSeason"} direction={sortDirection} onClick={() => toggleSort("preSeason")} />
              <Th label="Cur" width="w-14" active={sortKey === "current"} direction={sortDirection} onClick={() => toggleSort("current")} />
              <Th label="Player" active={sortKey === "name"} direction={sortDirection} onClick={() => toggleSort("name")} />
              <th className="w-24 whitespace-nowrap border-b-2 border-slate-200 px-2 py-1">Pos</th>
              <Th label="Team" width="w-16" active={sortKey === "team"} direction={sortDirection} onClick={() => toggleSort("team")} />
              <th className="w-24 whitespace-nowrap border-b-2 border-slate-200 px-2 py-1">Status</th>
              <Th label="GP" width="w-12" active={sortKey === "gp"} direction={sortDirection} onClick={() => toggleSort("gp")} />
              <Th label="Fan Pts" width="w-20" active={sortKey === "fanPts"} direction={sortDirection} onClick={() => toggleSort("fanPts")} />
              {viewMode === "skaters" ? (
                <>
                  <th className="w-16 whitespace-nowrap border-b-2 border-slate-200 px-2 py-1">TOI/G</th>
                  <Th label="G" width="w-10" active={sortKey === "goals"} direction={sortDirection} onClick={() => toggleSort("goals")} />
                  <Th label="A" width="w-10" active={sortKey === "assists"} direction={sortDirection} onClick={() => toggleSort("assists")} />
                  <Th label="+/-" width="w-12" active={sortKey === "plusMinus"} direction={sortDirection} onClick={() => toggleSort("plusMinus")} />
                  <Th label="PPP" width="w-12" active={sortKey === "ppp"} direction={sortDirection} onClick={() => toggleSort("ppp")} />
                  <Th label="SOG" width="w-14" active={sortKey === "sog"} direction={sortDirection} onClick={() => toggleSort("sog")} />
                  <Th label="HIT" width="w-14" active={sortKey === "hits"} direction={sortDirection} onClick={() => toggleSort("hits")} />
                  <Th label="BLK" width="w-14" active={sortKey === "blocks"} direction={sortDirection} onClick={() => toggleSort("blocks")} />
                </>
              ) : (
                <>
                  <th className="w-20 whitespace-nowrap border-b-2 border-slate-200 px-2 py-1">TOI</th>
                  <Th label="W" width="w-10" active={sortKey === "wins"} direction={sortDirection} onClick={() => toggleSort("wins")} />
                  <Th label="GA" width="w-12" active={sortKey === "goalsAgainst"} direction={sortDirection} onClick={() => toggleSort("goalsAgainst")} />
                  <Th label="SV" width="w-14" active={sortKey === "saves"} direction={sortDirection} onClick={() => toggleSort("saves")} />
                  <Th label="SHO" width="w-14" active={sortKey === "shutouts"} direction={sortDirection} onClick={() => toggleSort("shutouts")} />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => {
              const isKeeper = player.rosterStatus !== "FA";
              const isMyKeeper = player.rosterStatus === myTeamName;
              // A stale pick from before a keeper reload doesn't count once the player is actually kept (by anyone).
              const isMyPick = !isKeeper && draftedByMeIds.has(player.id);
              const isTakenByOther = !isKeeper && !isMyPick && takenByOthersIds.has(player.id);
              const isMine = isMyKeeper || isMyPick;
              const isUnavailable = isKeeper || isMyPick || isTakenByOther;
              const canUndo = isMyPick || isTakenByOther;
              const blockedByFullRoster = nextPickIsMine && isRosterFull;

              return (
                <tr
                  key={player.id}
                  title={isMyKeeper ? "Your keeper" : isKeeper ? `Kept by ${player.rosterStatus}` : undefined}
                  className={`border-b border-slate-200 ${
                    isMine ? "bg-blue-50" : isUnavailable ? "bg-slate-50 text-slate-400" : "hover:bg-blue-50/60"
                  }`}
                >
                  <td className="whitespace-nowrap px-2 py-1 font-bold tabular-nums text-slate-900">{player.rankPreSeason}</td>
                  <td className="whitespace-nowrap px-2 py-1 tabular-nums text-slate-500">{player.rankCurrent}</td>
                  <td className="overflow-hidden px-2 py-1 font-semibold text-blue-900">
                    <span className="truncate">{player.name}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1">
                    <span className="flex gap-1">
                      {player.positions.map((pos) => (
                        <span key={pos} className={`rounded px-1.5 py-0.5 text-xs font-bold ${HOCKEY_POSITION_STYLES[pos]}`}>
                          {pos}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 font-medium text-slate-500">{player.team}</td>
                  <td className="whitespace-nowrap px-2 py-1">
                    {isUnavailable ? (
                      canUndo ? (
                        <button
                          type="button"
                          onClick={() => onUndoDraft(player.id)}
                          title="Click to undo this pick"
                          className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-red-100 hover:text-red-700"
                        >
                          Drafted
                        </button>
                      ) : (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-600">Drafted</span>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={blockedByFullRoster}
                        onClick={() => onDraftPlayer(player.id)}
                        title={
                          blockedByFullRoster
                            ? "Your roster is full"
                            : nextPickIsMine
                              ? "Draft to your team"
                              : "Mark as taken by another team"
                        }
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                          blockedByFullRoster ? "cursor-not-allowed bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        Draft
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.gamesPlayed}</td>
                  <td className="whitespace-nowrap px-2 py-1 font-semibold tabular-nums text-slate-900">
                    {player.fantasyPoints.toFixed(1)}
                  </td>
                  {player.kind === "skater" ? (
                    <>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.toiPerGame}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.goals}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.assists}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.plusMinus}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.powerPlayPoints}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.shotsOnGoal}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.hits}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.blocks}</td>
                    </>
                  ) : (
                    <>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.timeOnIce}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.wins}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.goalsAgainst}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.saves}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">{player.shutouts}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
