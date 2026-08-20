import { useState } from "react";
import { DraftTreeEditor } from "./DraftTreeEditor";
import { DraftTreeList } from "./DraftTreeList";
import type { DraftConfig, DraftTree, Player, SavedTeam } from "../types";

interface DraftTreePageProps {
  trees: DraftTree[];
  savedTeams: SavedTeam[];
  players: Player[];
  config: DraftConfig;
  onCreateTree: (tree: DraftTree) => void;
  onRenameTree: (id: string, name: string) => void;
  onDeleteTree: (id: string) => void;
  onAddNode: (treeId: string, parentId: string | null, player: Player) => void;
  onDeleteNode: (treeId: string, nodeId: string) => void;
}

export function DraftTreePage({
  trees,
  savedTeams,
  players,
  config,
  onCreateTree,
  onRenameTree,
  onDeleteTree,
  onAddNode,
  onDeleteNode,
}: DraftTreePageProps) {
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const activeTree = trees.find((t) => t.id === activeTreeId);

  if (activeTree) {
    return (
      <DraftTreeEditor
        tree={activeTree}
        players={players}
        onBack={() => setActiveTreeId(null)}
        onRename={(name) => onRenameTree(activeTree.id, name)}
        onAddNode={(parentId, player) => onAddNode(activeTree.id, parentId, player)}
        onDeleteNode={(nodeId) => onDeleteNode(activeTree.id, nodeId)}
      />
    );
  }

  return (
    <DraftTreeList
      trees={trees}
      savedTeams={savedTeams}
      players={players}
      config={config}
      onCreateTree={onCreateTree}
      onRenameTree={onRenameTree}
      onDeleteTree={onDeleteTree}
      onOpenTree={setActiveTreeId}
    />
  );
}
