import { getMyPicks } from "./snakeDraft";
import type { DraftConfig, DraftTree, DraftTreeNode, DraftTreePlayer, SavedTeam } from "./types";

export function createTreeFromScratch(name: string, config: DraftConfig, player: DraftTreePlayer): DraftTree {
  const picks = getMyPicks(config);
  const root: DraftTreeNode = { id: crypto.randomUUID(), pick: picks[0], player, children: [] };
  return { id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), config, roots: [root] };
}

/** Chains a saved team's picks (already in draft order) into a single straight-line path, ready to branch off from. */
export function createTreeFromSavedTeam(name: string, team: SavedTeam): DraftTree {
  const sortedPicks = [...team.picks].sort((a, b) => a.pick - b.pick);
  let children: DraftTreeNode[] = [];
  for (let i = sortedPicks.length - 1; i >= 0; i--) {
    const { pick, player } = sortedPicks[i];
    children = [{ id: crypto.randomUUID(), pick, player, children }];
  }
  return { id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), config: team.config, roots: children };
}

/** Adds a new pick as a child of `parentId` (or a new Round-1 root if `parentId` is null). */
export function addTreeNode(tree: DraftTree, parentId: string | null, player: DraftTreePlayer): DraftTree {
  const picks = getMyPicks(tree.config);

  if (parentId === null) {
    const newRoot: DraftTreeNode = { id: crypto.randomUUID(), pick: picks[0], player, children: [] };
    return { ...tree, roots: [...tree.roots, newRoot] };
  }

  function recurse(nodes: DraftTreeNode[], depth: number): DraftTreeNode[] {
    return nodes.map((n) => {
      if (n.id === parentId) {
        const childDepth = depth + 1;
        if (childDepth >= picks.length) return n; // no further round configured
        const newChild: DraftTreeNode = { id: crypto.randomUUID(), pick: picks[childDepth], player, children: [] };
        return { ...n, children: [...n.children, newChild] };
      }
      return n.children.length ? { ...n, children: recurse(n.children, depth + 1) } : n;
    });
  }

  return { ...tree, roots: recurse(tree.roots, 0) };
}

/** Removes a node and its entire subtree, wherever it is in the tree. */
export function deleteTreeNode(tree: DraftTree, nodeId: string): DraftTree {
  function recurse(nodes: DraftTreeNode[]): DraftTreeNode[] {
    return nodes.filter((n) => n.id !== nodeId).map((n) => ({ ...n, children: recurse(n.children) }));
  }
  return { ...tree, roots: recurse(tree.roots) };
}

/** Player ids already used from the root down to (and including) `nodeId`, to exclude when picking its next child. */
export function collectPathPlayerIds(tree: DraftTree, nodeId: string | null): Set<string> {
  const ids = new Set<string>();
  if (nodeId === null) return ids;

  function find(nodes: DraftTreeNode[], path: DraftTreeNode[]): DraftTreeNode[] | null {
    for (const n of nodes) {
      const nextPath = [...path, n];
      if (n.id === nodeId) return nextPath;
      const found = find(n.children, nextPath);
      if (found) return found;
    }
    return null;
  }

  const path = find(tree.roots, []);
  if (path) for (const n of path) ids.add(n.player.id);
  return ids;
}

export interface PositionedTreeNode {
  node: DraftTreeNode;
  depth: number;
  x: number;
  y: number;
  parentId: string | null;
}

/** Vertical space per round (top-to-bottom). */
export const TREE_LEVEL_HEIGHT = 140;
/** Horizontal space per branch slot (left-to-right). */
export const TREE_BRANCH_WIDTH = 216;
export const TREE_NODE_WIDTH = 196;
export const TREE_NODE_HEIGHT = 92;

/** Lays a tree out top-to-bottom (rounds) with branches spread left-to-right, without overlap. */
export function layoutTree(roots: DraftTreeNode[]): { positioned: PositionedTreeNode[]; cols: number; maxDepth: number } {
  const positioned: PositionedTreeNode[] = [];
  let leafIndex = 0;
  let maxDepth = 0;

  function place(node: DraftTreeNode, depth: number, parentId: string | null): number {
    maxDepth = Math.max(maxDepth, depth);
    let col: number;
    if (node.children.length === 0) {
      col = leafIndex;
      leafIndex++;
    } else {
      const childCols = node.children.map((c) => place(c, depth + 1, node.id));
      col = (childCols[0] + childCols[childCols.length - 1]) / 2;
    }
    positioned.push({ node, depth, x: col * TREE_BRANCH_WIDTH, y: depth * TREE_LEVEL_HEIGHT, parentId });
    return col;
  }

  for (const root of roots) place(root, 0, null);

  return { positioned, cols: Math.max(leafIndex, 1), maxDepth };
}
