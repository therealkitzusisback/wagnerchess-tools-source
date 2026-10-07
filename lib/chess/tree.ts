// The analysis is a tree of moves: every position can have several follow-up moves
// (the first one is the main line, the others are variations).

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const ROOT = "root";

export type MoveNode = {
  id: string;
  parent: string | null;
  san: string; // e.g. "Nf3"
  uci: string; // e.g. "g1f3" (promotion: "e7e8q")
  fen: string; // position AFTER this move
  children: string[]; // first = main line
  nags?: number[]; // symbols (see lib/chess/nags.ts)
  comment?: string; // written comment AFTER the move (the start position can have one, too); line breaks are kept
  commentBefore?: string; // written comment BEFORE the move
  clock?: number; // remaining time (seconds) of the player who made the move, right after the move
  clockMin?: boolean; // typed in by hand (shown in whole minutes); times of an imported game are shown exactly
};

export type MoveTree = { nodes: Record<string, MoveNode>; counter: number };

export function createTree(fen: string = START_FEN): MoveTree {
  return {
    nodes: { [ROOT]: { id: ROOT, parent: null, san: "", uci: "", fen, children: [] } },
    counter: 0,
  };
}

// Adds a move below a position. If the same move exists already, that one is used.
export function addMove(tree: MoveTree, parentId: string, move: { san: string; uci: string; fen: string }): string {
  const parent = tree.nodes[parentId];
  const existing = parent.children.find((id) => tree.nodes[id].uci === move.uci);
  if (existing) return existing;
  const id = `n${++tree.counter}`;
  tree.nodes[id] = { id, parent: parentId, ...move, children: [] };
  parent.children.push(id);
  return id;
}

// All node ids from the start position to the given node.
export function pathTo(tree: MoveTree, id: string): string[] {
  const path: string[] = [];
  let cur: string | null = id;
  while (cur) {
    path.unshift(cur);
    cur = tree.nodes[cur].parent;
  }
  return path;
}

// Follows the main line to its end.
export function mainlineEnd(tree: MoveTree, id: string): string {
  let cur = id;
  while (tree.nodes[cur].children.length > 0) cur = tree.nodes[cur].children[0];
  return cur;
}

// Deletes a move and everything after it. Returns the id of the position before it.
export function removeNode(tree: MoveTree, id: string): string | null {
  const node = tree.nodes[id];
  if (!node || !node.parent) return null;
  const parentId = node.parent;
  const stack = [id];
  while (stack.length > 0) {
    const n = stack.pop() as string;
    stack.push(...tree.nodes[n].children);
    delete tree.nodes[n];
  }
  tree.nodes[parentId].children = tree.nodes[parentId].children.filter((c) => c !== id);
  return parentId;
}

export function hasMoves(tree: MoveTree): boolean {
  return tree.nodes[ROOT].children.length > 0;
}

// ---- Lines: promote, demote, make main ----
// "The line" of a move = the nearest move (itself or one before it) that has alternatives at the same place.
export function lineStart(tree: MoveTree, id: string): string | null {
  let cur: string | null = id;
  while (cur && cur !== ROOT) {
    const node: MoveNode = tree.nodes[cur];
    if (node.parent && tree.nodes[node.parent].children.length > 1) return cur;
    cur = node.parent;
  }
  return null;
}
const place = (tree: MoveTree, id: string) => {
  const start = lineStart(tree, id);
  if (!start) return null;
  const siblings = tree.nodes[tree.nodes[start].parent as string].children;
  return { start, siblings, index: siblings.indexOf(start) };
};
export const canPromote = (tree: MoveTree, id: string) => (place(tree, id)?.index ?? 0) > 0;
export const canDemote = (tree: MoveTree, id: string) => { const p = place(tree, id); return Boolean(p && p.index < p.siblings.length - 1); };
export function promoteLine(tree: MoveTree, id: string): boolean {
  const p = place(tree, id);
  if (!p || p.index <= 0) return false;
  [p.siblings[p.index - 1], p.siblings[p.index]] = [p.siblings[p.index], p.siblings[p.index - 1]];
  return true;
}
export function demoteLine(tree: MoveTree, id: string): boolean {
  const p = place(tree, id);
  if (!p || p.index >= p.siblings.length - 1) return false;
  [p.siblings[p.index + 1], p.siblings[p.index]] = [p.siblings[p.index], p.siblings[p.index + 1]];
  return true;
}
export function makeMainLine(tree: MoveTree, id: string): boolean {
  const p = place(tree, id);
  if (!p || p.index <= 0) return false;
  p.siblings.splice(p.index, 1);
  p.siblings.unshift(p.start);
  return true;
}
