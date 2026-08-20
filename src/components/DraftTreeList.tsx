import { useState } from "react";
import { createTreeFromSavedTeam, createTreeFromScratch } from "../draftTree";
import { PlayerSearchList } from "./PlayerSearchList";
import type { DraftConfig, DraftTree, Player, SavedTeam } from "../types";

interface DraftTreeListProps {
  trees: DraftTree[];
  savedTeams: SavedTeam[];
  players: Player[];
  config: DraftConfig;
  onCreateTree: (tree: DraftTree) => void;
  onRenameTree: (id: string, name: string) => void;
  onDeleteTree: (id: string) => void;
  onOpenTree: (id: string) => void;
}

export function DraftTreeList({
  trees,
  savedTeams,
  players,
  config,
  onCreateTree,
  onRenameTree,
  onDeleteTree,
  onOpenTree,
}: DraftTreeListProps) {
  const [importValue, setImportValue] = useState("");
  const [showScratchPicker, setShowScratchPicker] = useState(false);

  function handleImport(teamId: string) {
    const team = savedTeams.find((t) => t.id === teamId);
    if (!team) return;
    const tree = createTreeFromSavedTeam(`${team.name} Scenario`, team);
    onCreateTree(tree);
    onOpenTree(tree.id);
    setImportValue("");
  }

  function handleScratchPick(player: Player) {
    const tree = createTreeFromScratch(`Scenario ${trees.length + 1}`, config, {
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team,
    });
    onCreateTree(tree);
    onOpenTree(tree.id);
    setShowScratchPicker(false);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">Start a New Scenario</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Import Saved Team</span>
            <select
              value={importValue}
              onChange={(e) => e.target.value && handleImport(e.target.value)}
              disabled={savedTeams.length === 0}
              className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {savedTeams.length === 0 ? "No saved teams yet" : "Choose a saved team..."}
              </option>
              {savedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <div className="relative flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Start From Scratch — Round 1 Pick
            </span>
            <button
              type="button"
              onClick={() => setShowScratchPicker((s) => !s)}
              className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-left text-sm text-slate-400 outline-none hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              Search a player...
            </button>
            {showScratchPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowScratchPicker(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 rounded-md border border-slate-200 bg-white shadow-lg">
                  <PlayerSearchList players={players} onSelect={handleScratchPick} autoFocus />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {trees.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400">
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {trees.map((tree) => (
            <TreeCard key={tree.id} tree={tree} onRename={onRenameTree} onDelete={onDeleteTree} onOpen={onOpenTree} />
          ))}
        </div>
      )}
    </div>
  );
}

function countNodes(tree: DraftTree): number {
  function count(nodes: DraftTree["roots"]): number {
    return nodes.reduce((sum, n) => sum + 1 + count(n.children), 0);
  }
  return count(tree.roots);
}

function TreeCard({
  tree,
  onRename,
  onDelete,
  onOpen,
}: {
  tree: DraftTree;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <input
          value={tree.name}
          onChange={(e) => onRename(tree.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded px-1 py-0.5 text-sm font-bold text-slate-900 outline-none hover:bg-slate-50 focus:bg-blue-50 focus:ring-1 focus:ring-blue-600"
        />
        <button
          type="button"
          onClick={() => onDelete(tree.id)}
          title="Delete scenario"
          className="shrink-0 text-slate-300 transition-colors hover:text-red-500"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span>{tree.config.teams} Teams</span>
        <span>·</span>
        <span>Pick {tree.config.slot}</span>
        <span>·</span>
        <span>{countNodes(tree)} picks</span>
      </div>
      <button
        type="button"
        onClick={() => onOpen(tree.id)}
        className="px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50/60"
      >
        Open scenario →
      </button>
    </div>
  );
}
