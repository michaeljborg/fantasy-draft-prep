import { useEffect, useMemo, useState } from "react";
import { POSITION_STYLES, SLOT_STYLES } from "../positionStyles";
import { buildPositionalSlots, type SlotLabel } from "../rosterSlots";
import type { DraftConfig, Player, Selections } from "../types";

type ViewMode = "positional" | "draftOrder";

type NamedPlayer = Pick<Player, "name" | "position">;

/** DST names are stored as "<Team Name> DST" -- drop the redundant suffix since the position badge already shows DST. */
export function displayName(player: NamedPlayer) {
  return player.position === "DST" && player.name.endsWith(" DST") ? player.name.slice(0, -4) : player.name;
}

export interface PickRowProps {
  label: string;
  /** Render `label` as a colored position badge (Positional view) instead of plain text (Draft Order view). */
  isPositionLabel?: boolean;
  sublabel?: string;
  player?: NamedPlayer;
  isArmed: boolean;
  onClick: () => void;
}

/** Shared with MyTeamsPage so saved-team rosters render with identical styling to the live Draft Board. */
export function PickRow({ label, isPositionLabel, sublabel, player, isArmed, onClick }: PickRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 border-b border-slate-100 border-l-4 px-5 py-2.5 text-left text-sm transition-colors ${
          isArmed ? "border-l-blue-600 bg-blue-50 text-blue-900" : "border-l-transparent hover:bg-slate-50"
        }`}
      >
        <span className="flex shrink-0 items-center gap-1.5">
          {isPositionLabel ? (
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-bold ${SLOT_STYLES[label as SlotLabel] ?? "bg-slate-100 text-slate-500"}`}
            >
              {label}
            </span>
          ) : (
            <span className="font-bold tabular-nums text-slate-900">{label}</span>
          )}
          {sublabel && <span className="text-xs font-normal text-slate-400">{sublabel}</span>}
        </span>
        {player ? (
          <span className="ml-auto flex min-w-0 items-center gap-1.5">
            <span className="truncate font-semibold text-slate-900">{displayName(player)}</span>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${POSITION_STYLES[player.position]}`}
            >
              {player.position}
            </span>
          </span>
        ) : (
          <span className="ml-auto shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
            {isArmed ? "select a player →" : "empty"}
          </span>
        )}
      </button>
    </li>
  );
}

interface MyTeamPanelProps {
  config: DraftConfig;
  onConfigChange: (config: DraftConfig) => void;
  myPicks: number[];
  selections: Selections;
  armedPick: number | null;
  onArmPick: (pick: number) => void;
  playersById: Record<string, Player>;
  canSave: boolean;
  onSaveTeam: () => void;
  onClearTeam: () => void;
}

export function MyTeamPanel({
  config,
  onConfigChange,
  myPicks,
  selections,
  armedPick,
  onArmPick,
  playersById,
  canSave,
  onSaveTeam,
  onClearTeam,
}: MyTeamPanelProps) {
  const [justSaved, setJustSaved] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("draftOrder");

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 1500);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const positionalSlots = useMemo(
    () => buildPositionalSlots(myPicks, selections, playersById),
    [myPicks, selections, playersById]
  );

  const nextOpenPick = myPicks.find((pick) => !selections[pick]);

  function updateConfig(field: keyof DraftConfig, value: number) {
    if (Number.isNaN(value) || value < 1) return;
    onConfigChange({ ...config, [field]: value });
  }

  function handleSaveClick() {
    onSaveTeam();
    setJustSaved(true);
  }

  function handleClearClick() {
    if (window.confirm("Clear all picks from this board? This won't affect any saved teams.")) {
      onClearTeam();
    }
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-bold uppercase tracking-wide text-slate-900">My Team</h1>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={!canSave}
              onClick={handleClearClick}
              title={canSave ? "Clear all picks" : "Nothing to clear"}
              className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                !canSave
                  ? "cursor-not-allowed bg-slate-100 text-slate-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSaveClick}
              title={canSave ? "Save this team to My Teams" : "Fill at least one pick first"}
              className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                !canSave
                  ? "cursor-not-allowed bg-slate-100 text-slate-300"
                  : justSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {justSaved ? "Saved ✓" : "Save Team"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Teams</span>
            <input
              type="number"
              min={2}
              max={20}
              value={config.teams}
              onChange={(e) => updateConfig("teams", Number(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1 font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pick</span>
            <input
              type="number"
              min={1}
              max={config.teams}
              value={config.slot}
              onChange={(e) => updateConfig("slot", Number(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1 font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Rounds</span>
            <input
              type="number"
              min={1}
              max={30}
              value={config.rounds}
              onChange={(e) => updateConfig("rounds", Number(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1 font-semibold tabular-nums text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>
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

      <div className="flex-1 overflow-y-auto">
        <ul>
          {viewMode === "draftOrder"
            ? myPicks.map((pick, i) => {
                const player = selections[pick] ? playersById[selections[pick]!] : undefined;
                return (
                  <PickRow
                    key={pick}
                    label={`R${i + 1}`}
                    sublabel={String(pick)}
                    player={player}
                    isArmed={armedPick === pick}
                    onClick={() => onArmPick(pick)}
                  />
                );
              })
            : positionalSlots.map((slot, i) => {
                const player = slot.playerId ? playersById[slot.playerId] : undefined;
                const isArmed = slot.pick != null ? armedPick === slot.pick : armedPick != null && armedPick === nextOpenPick;
                return (
                  <PickRow
                    key={`${slot.label}-${i}`}
                    label={slot.label}
                    isPositionLabel
                    sublabel={slot.pick ? `Pick ${slot.pick}` : undefined}
                    player={player}
                    isArmed={isArmed}
                    onClick={() => {
                      const target = slot.pick ?? nextOpenPick;
                      if (target != null) onArmPick(target);
                    }}
                  />
                );
              })}
        </ul>
      </div>
    </div>
  );
}
