import { useMemo, useState } from "react";
import { PickRow } from "./MyTeamPanel";
import { buildPositionalSlots } from "../rosterSlots";
import type { SavedTeam, SavedTeamPick, Selections } from "../types";

type ViewMode = "positional" | "draftOrder";

interface MyTeamsPageProps {
  teams: SavedTeam[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function MyTeamsPage({ teams, onRename, onDelete }: MyTeamsPageProps) {
  if (teams.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-100 px-6 text-center">
        <p className="text-base font-semibold text-slate-500">No saved teams yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} onRename={onRename} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function TeamCard({
  team,
  onRename,
  onDelete,
}: {
  team: SavedTeam;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  // Same positional-roster layout as the live Draft Board -- built from this
  // team's own snapshotted picks, independent of the current player pool.
  const { myPicks, selections, playersById } = useMemo(() => {
    const sel: Selections = {};
    const byId: Record<string, SavedTeamPick["player"]> = {};
    for (const { pick, player } of team.picks) {
      sel[pick] = player.id;
      byId[player.id] = player;
    }
    return { myPicks: team.picks.map((p) => p.pick), selections: sel, playersById: byId };
  }, [team.picks]);

  const slots = useMemo(
    () => buildPositionalSlots(myPicks, selections, playersById),
    [myPicks, selections, playersById]
  );

  const [viewMode, setViewMode] = useState<ViewMode>("positional");

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <input
          value={team.name}
          onChange={(e) => onRename(team.id, e.target.value)}
          className="w-full rounded px-1 py-0.5 text-sm font-bold text-slate-900 outline-none hover:bg-slate-50 focus:bg-blue-50 focus:ring-1 focus:ring-blue-600"
        />
        <button
          type="button"
          onClick={() => onDelete(team.id)}
          title="Delete team"
          className="shrink-0 text-slate-300 transition-colors hover:text-red-500"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-5 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>{team.config.teams} Teams</span>
        <span>·</span>
        <span>Pick {team.config.slot}</span>
        <span>·</span>
        <span>{new Date(team.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-1 border-b border-slate-100 px-5 py-2">
        {(["draftOrder", "positional"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
              viewMode === mode ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {mode === "positional" ? "Positional" : "Draft Order"}
          </button>
        ))}
      </div>
      <ul>
        {viewMode === "positional"
          ? slots.map((slot, i) => (
              <PickRow
                key={`${slot.label}-${i}`}
                label={slot.label}
                isPositionLabel
                sublabel={slot.pick ? `Pick ${slot.pick}` : undefined}
                player={slot.playerId ? playersById[slot.playerId] : undefined}
                isArmed={false}
                onClick={() => {}}
              />
            ))
          : myPicks.map((pick, i) => (
              <PickRow
                key={pick}
                label={`R${i + 1}`}
                sublabel={String(pick)}
                player={selections[pick] ? playersById[selections[pick]!] : undefined}
                isArmed={false}
                onClick={() => {}}
              />
            ))}
      </ul>
    </div>
  );
}
