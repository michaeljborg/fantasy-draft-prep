import { HOCKEY_POSITION_STYLES, HOCKEY_SLOT_STYLES } from "../positionStyles";
import type { HockeyRosterSlot, HockeyRosterSlotLabel } from "../hockeyRosterSlots";
import type { HockeyPlayer } from "../types";

interface HockeyTeamPanelProps {
  slots: HockeyRosterSlot[];
  playersById: Record<string, HockeyPlayer>;
  myTeamName: string;
  onUndoDraft: (playerId: string) => void;
  onClearPicks: () => void;
  canClearPicks: boolean;
  keepersLoaded: boolean;
  onToggleKeepers: () => void;
  nextPickIsMine: boolean;
  onToggleNextPickIsMine: () => void;
  onMoveToSlot: (playerId: string, targetLabel: HockeyRosterSlotLabel) => void;
  onResetBoard: () => void;
}

export function HockeyTeamPanel({
  slots,
  playersById,
  myTeamName,
  onUndoDraft,
  onClearPicks,
  canClearPicks,
  keepersLoaded,
  onToggleKeepers,
  nextPickIsMine,
  onToggleNextPickIsMine,
  onMoveToSlot,
  onResetBoard,
}: HockeyTeamPanelProps) {
  function handleClearClick() {
    if (window.confirm("Clear all picks (yours and other teams') from this board? Your keepers will stay.")) {
      onClearPicks();
    }
  }

  function handleResetClick() {
    if (window.confirm("Reset the board back to a fresh draft? All picks will be cleared and keepers will be unloaded.")) {
      onResetBoard();
    }
  }

  return (
    <div className="flex h-full w-96 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h1 className="text-sm font-bold uppercase tracking-wide text-slate-900">My Team</h1>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={!canClearPicks}
            onClick={handleClearClick}
            title={canClearPicks ? "Clear all drafted picks" : "Nothing to clear"}
            className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
              canClearPicks
                ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                : "cursor-not-allowed bg-slate-100 text-slate-300"
            }`}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleResetClick}
            title="Clear all picks and unload keepers -- back to a blank board"
            className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700"
          >
            Reset Board
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-6 py-2.5">
        <span className="text-xs font-semibold text-slate-500">
          Keepers {keepersLoaded ? "loaded" : "unloaded"}
        </span>
        <button
          type="button"
          onClick={onToggleKeepers}
          title={
            keepersLoaded
              ? "Unload keepers -- treat every player as a free agent for a fresh draft"
              : "Load keepers -- restore the saved keeper rosters"
          }
          className={`relative h-5 w-9 shrink-0 rounded-full border-0 p-0 transition-colors ${
            keepersLoaded ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              keepersLoaded ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="border-b border-slate-100 px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {nextPickIsMine ? "Draft → My Team" : "Draft"}
          </span>
          <button
            type="button"
            onClick={onToggleNextPickIsMine}
            title={
              nextPickIsMine
                ? "Armed: the next Draft click goes to your team"
                : "Default: Draft clicks just mark a player as taken by another team"
            }
            className={`relative h-5 w-9 shrink-0 rounded-full border-0 p-0 transition-colors ${
              nextPickIsMine ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                nextPickIsMine ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul>
          {slots.map((slot, i) => {
            const player = slot.playerId ? playersById[slot.playerId] : undefined;
            const isKeeper = player?.rosterStatus === myTeamName;
            const isDualEligible = player ? player.positions.length > 1 : false;

            return (
              <li key={`${slot.label}-${i}`}>
                <div className="flex w-full items-center gap-2 border-b border-slate-100 px-5 py-2.5 text-left text-sm">
                  <span
                    className={`flex w-9 shrink-0 items-center justify-center rounded py-0.5 text-xs font-bold ${HOCKEY_SLOT_STYLES[slot.label]}`}
                  >
                    {slot.label}
                  </span>
                  {player ? (
                    <>
                      <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="truncate font-semibold text-slate-900">{player.name}</span>
                        <span className="shrink-0 text-xs font-medium text-slate-400">{player.team}</span>
                        {isDualEligible && (
                          <span className="flex shrink-0 gap-1">
                            {player.positions.map((pos) => {
                              const isCurrent = pos === slot.label;
                              const hasOpenSlot = slots.some((s) => s.label === pos && !s.playerId);
                              return (
                                <button
                                  key={pos}
                                  type="button"
                                  disabled={isCurrent || !hasOpenSlot}
                                  onClick={() => onMoveToSlot(player.id, pos)}
                                  title={
                                    isCurrent
                                      ? `Currently playing ${pos}`
                                      : hasOpenSlot
                                        ? `Move to ${pos}`
                                        : `All ${pos} slots are full`
                                  }
                                  className={`rounded px-1 py-0.5 text-[9px] font-bold ${HOCKEY_POSITION_STYLES[pos]} ${
                                    isCurrent
                                      ? "ring-1 ring-inset ring-slate-400"
                                      : hasOpenSlot
                                        ? "cursor-pointer hover:ring-1 hover:ring-slate-400"
                                        : "cursor-not-allowed opacity-40"
                                  }`}
                                >
                                  {pos}
                                </button>
                              );
                            })}
                          </span>
                        )}
                      </span>
                      {isKeeper ? (
                        <span
                          title="Keeper -- can't be removed here"
                          className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700"
                        >
                          Keep
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUndoDraft(player.id)}
                          title="Undo this pick"
                          className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 hover:bg-red-100 hover:text-red-700"
                        >
                          Undo
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="ml-auto shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                      empty
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
