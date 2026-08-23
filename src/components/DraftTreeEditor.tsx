import { useMemo, useState } from "react";
import {
  TREE_BRANCH_WIDTH,
  TREE_LEVEL_HEIGHT,
  TREE_NODE_HEIGHT,
  TREE_NODE_WIDTH,
  collectPathPlayerIds,
  layoutTree,
} from "../draftTree";
import { getMyPicks } from "../snakeDraft";
import { POSITION_STYLES } from "../positionStyles";
import { TreePlayerBoard } from "./TreePlayerBoard";
import type { DraftTree, Player } from "../types";

const CANVAS_PAD = 32;

interface DraftTreeEditorProps {
  tree: DraftTree;
  players: Player[];
  onBack: () => void;
  onRename: (name: string) => void;
  onAddNode: (parentId: string | null, player: Player) => void;
  onDeleteNode: (nodeId: string) => void;
}

/** Which node's (or, if null-parent, which "add root") picker is currently open. Only one at a time. */
type OpenPicker = { parentId: string | null };

export function DraftTreeEditor({ tree, players, onBack, onRename, onAddNode, onDeleteNode }: DraftTreeEditorProps) {
  const picks = useMemo(() => getMyPicks(tree.config), [tree.config]);
  const { positioned, cols, maxDepth } = useMemo(() => layoutTree(tree.roots), [tree.roots]);
  const [openPicker, setOpenPicker] = useState<OpenPicker | null>(null);

  const byId = useMemo(() => new Map(positioned.map((p) => [p.node.id, p])), [positioned]);
  const canvasWidth = cols * TREE_BRANCH_WIDTH + CANVAS_PAD * 2;
  const canvasHeight = (maxDepth + 1) * TREE_LEVEL_HEIGHT + CANVAS_PAD * 2;
  const canAddRoot = picks.length > 0;

  function togglePicker(parentId: string | null) {
    setOpenPicker((prev) => (prev?.parentId === parentId ? null : { parentId }));
  }

  function handleSelect(player: Player) {
    if (openPicker) {
      onAddNode(openPicker.parentId, player);
      setOpenPicker(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <button type="button" onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-900">
          ← Trees
        </button>
        <input
          value={tree.name}
          onChange={(e) => onRename(e.target.value)}
          className="rounded px-1 py-0.5 text-sm font-bold text-slate-900 outline-none hover:bg-slate-50 focus:bg-blue-50 focus:ring-1 focus:ring-blue-600"
        />
        <div className="ml-auto flex items-center gap-2">
          <Badge label={`${tree.config.teams} Teams`} />
          <Badge label={`Pick ${tree.config.slot}`} />
          <Badge label={`${tree.config.rounds} Rounds`} />
          {canAddRoot && (
            <button
              type="button"
              onClick={() => togglePicker(null)}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              + Round 1 Option
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-auto p-6">
        {tree.roots.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No picks yet — use "+ Round 1 Option" above to start this scenario.
          </div>
        ) : (
          <div className="relative shrink-0" style={{ width: canvasWidth, height: canvasHeight }}>
            <svg className="pointer-events-none absolute inset-0" width={canvasWidth} height={canvasHeight}>
              {positioned
                .filter((p) => p.parentId)
                .map((p) => {
                  const parent = byId.get(p.parentId!);
                  if (!parent) return null;
                  const x1 = parent.x + CANVAS_PAD + TREE_NODE_WIDTH / 2;
                  const y1 = parent.y + CANVAS_PAD + TREE_NODE_HEIGHT;
                  const x2 = p.x + CANVAS_PAD + TREE_NODE_WIDTH / 2;
                  const y2 = p.y + CANVAS_PAD;
                  const midY = (y1 + y2) / 2;
                  return (
                    <path
                      key={p.node.id}
                      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                      stroke="#cbd5e1"
                      strokeWidth={2}
                      fill="none"
                    />
                  );
                })}
            </svg>

            {positioned.map((p) => {
              const left = p.x + CANVAS_PAD;
              const top = p.y + CANVAS_PAD;
              const canAddChild = p.depth + 1 < picks.length;
              return (
                <div key={p.node.id}>
                  <div
                    className="absolute flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                    style={{ left, top, width: TREE_NODE_WIDTH, height: TREE_NODE_HEIGHT }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        R{p.depth + 1} · Pick {p.node.pick}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteNode(p.node.id)}
                        title="Delete this pick and everything after it"
                        className="text-slate-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-blue-900">{p.node.player.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${POSITION_STYLES[p.node.player.position]}`}
                      >
                        {p.node.player.position}
                      </span>
                    </div>
                    {canAddChild && (
                      <button
                        type="button"
                        onClick={() => togglePicker(p.node.id)}
                        className="self-start rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-blue-700"
                      >
                        + Add pick
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {openPicker && (
        <TreePlayerBoard
          players={players}
          myPicks={picks}
          excludeIds={collectPathPlayerIds(tree, openPicker.parentId)}
          targetPick={picks[(openPicker.parentId ? byId.get(openPicker.parentId)?.depth ?? -1 : -1) + 1]}
          title={
            openPicker.parentId === null
              ? "Select Round 1 Pick"
              : `Select Round ${(byId.get(openPicker.parentId)?.depth ?? 0) + 2} Pick`
          }
          onSelect={handleSelect}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-600">{label}</span>
  );
}
