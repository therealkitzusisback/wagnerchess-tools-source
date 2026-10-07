import { Chess } from "chess.js";
import { ROOT, START_FEN, addMove, createTree, type MoveTree } from "./tree";
import { clockFromComment, clockToPgn } from "./clock";
import { ALL_NAGS, SUFFIX_NAGS, toggleNag } from "./nags";

export type PgnHeaders = Record<string, string>;

function validFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ reading */

// Adds a symbol without removing it when it is there already (a PGN may list a symbol twice).
function toggleNagKeep(nags: number[] | undefined, nag: number): number[] {
  return nags?.includes(nag) ? nags : toggleNag(nags, nag);
}

// Reads the first game of a PGN text, including variations, comments and symbols ($1, "!?" ...).
export function parsePgn(text: string): { tree: MoveTree; headers: PgnHeaders } {
  const lines = text.replace(/\r/g, "").split("\n");
  const headers: PgnHeaders = {};
  const moveLines: string[] = [];
  let inMoves = false;

  for (const line of lines) {
    const header = line.match(/^\s*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/);
    if (header) {
      if (inMoves) break; // the next game starts here
      headers[header[1]] = header[2].replace(/\\(["\\])/g, "$1");
    } else if (inMoves || line.trim() !== "") {
      inMoves = true;
      moveLines.push(line); // empty lines inside a comment are kept
    }
  }

  const startFen = headers.FEN && validFen(headers.FEN) ? headers.FEN : START_FEN;
  const tree = createTree(startFen);

  const tokens = moveLines.join("\n").match(/\{[^}]*\}|;[^\n]*|\(|\)|\$\d+|\d+\.(?:\.\.)?|\*|1-0|0-1|1\/2-1\/2|[^\s(){}]+/g) ?? [];
  if (tokens.length > 40000) throw new Error("PGN too long");

  let cur = ROOT;
  let prev = ROOT;
  const stack: { cur: string; prev: string }[] = [];
  let opened = false; // right after "(": comments belong BEFORE the first move of the variation
  let beforeBuf = "";

  for (const token of tokens) {
    if (token.startsWith("{") || token.startsWith(";")) {
      const raw = token.startsWith("{") ? token.slice(1, -1) : token.slice(1);
      const clk = clockFromComment(raw);
      if (clk !== null && !opened && cur !== ROOT) {
        tree.nodes[cur].clock = clk;
        if (/\[%clkm\]/.test(raw)) tree.nodes[cur].clockMin = true; // our own mark: this time was typed in by hand
      } // [%clk h:mm:ss] belongs to the move before the comment
      const text = raw.replace(/\[%[^\]]*\]/g, "").replace(/\r/g, "").trim(); // engine tags of other programs ([%eval ...]) are dropped; line breaks stay
      if (!text) continue;
      const markedBefore = /^\s*\[%before\]/.test(raw); // our own mark for a comment that stands BEFORE the next move
      if (opened || markedBefore) {
        beforeBuf = beforeBuf ? `${beforeBuf}\n${text}` : text;
      } else if (cur !== ROOT || prev === ROOT) {
        const n = tree.nodes[cur];
        n.comment = n.comment ? `${n.comment}\n${text}` : text;
      }
      continue;
    }
    if (token.startsWith("$")) {
      const nag = Number(token.slice(1));
      if (cur !== ROOT && ALL_NAGS.some((a) => a.nag === nag)) tree.nodes[cur].nags = toggleNagKeep(tree.nodes[cur].nags, nag);
      continue;
    }
    if (/^\d+\.(\.\.)?$/.test(token) || token === "*" || token === "1-0" || token === "0-1" || token === "1/2-1/2") continue;
    if (token === "(") {
      stack.push({ cur, prev });
      cur = prev;
      opened = true;
      beforeBuf = "";
      continue;
    }
    if (token === ")") {
      const top = stack.pop();
      if (top) {
        cur = top.cur;
        prev = top.prev;
      }
      continue;
    }

    const suffix = token.match(/[!?]+$/)?.[0] ?? "";
    const san = token.replace(/[!?]+$/g, "").replace(/^0-0-0$/, "O-O-O").replace(/^0-0$/, "O-O");
    const chess = new Chess(tree.nodes[cur].fen);
    let move;
    try {
      move = chess.move(san);
    } catch {
      throw new Error(`Illegal move: ${token}`);
    }
    const id = addMove(tree, cur, {
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ""}`,
      fen: chess.fen(),
    });
    if (beforeBuf) {
      const n = tree.nodes[id];
      n.commentBefore = n.commentBefore ? `${n.commentBefore}\n${beforeBuf}` : beforeBuf;
    }
    opened = false;
    beforeBuf = "";
    if (suffix && SUFFIX_NAGS[suffix]) tree.nodes[id].nags = toggleNagKeep(tree.nodes[id].nags, SUFFIX_NAGS[suffix]);
    prev = cur;
    cur = id;
  }

  return { tree, headers };
}

/* ------------------------------------------------------------------ writing */

// plain = the move starts the game or a variation: its "before" comment is unambiguous.
// Elsewhere a comment before a move would be read as the "after" comment of the move before, so it carries our mark [%before].
function token(tree: MoveTree, id: string, forceNumber: boolean, plain: boolean): string {
  const node = tree.nodes[id];
  const parentFen = tree.nodes[node.parent as string].fen.split(" ");
  const whiteToMove = parentFen[1] === "w";
  const number = parentFen[5] ?? "1";
  const extras = [
    ...(node.nags ?? []).map((n) => `$${n}`),
    ...(node.comment || node.clock !== undefined
      ? [`{${[node.clock !== undefined ? `[%clk ${clockToPgn(node.clock)}]${node.clockMin ? " [%clkm]" : ""}` : "", node.comment ? node.comment.replace(/[{}]/g, "") : ""].filter(Boolean).join(" ")}}`]
      : []),
  ];
  const san = [node.san, ...extras].join(" ");
  const before = node.commentBefore ? `{${plain ? "" : "[%before] "}${node.commentBefore.replace(/[{}]/g, "")}} ` : "";
  if (whiteToMove) return `${before}${number}. ${san}`;
  return before + (forceNumber ? `${number}... ${san}` : san);
}

function writeLine(tree: MoveTree, parentId: string, forceNumber: boolean): string[] {
  const out: string[] = [];
  let pid = parentId;
  let force = forceNumber;
  for (;;) {
    const parent = tree.nodes[pid];
    if (parent.children.length === 0) return out;
    const [mainId, ...variationIds] = parent.children;
    out.push(token(tree, mainId, force, pid === parentId && parentId === ROOT));
    for (const vid of variationIds) {
      const inner = [token(tree, vid, true, true), ...writeLine(tree, vid, Boolean(tree.nodes[vid].comment) || tree.nodes[vid].clock !== undefined)];
      out.push(`(${inner.join(" ")})`);
    }
    force = variationIds.length > 0 || Boolean(tree.nodes[mainId].comment) || tree.nodes[mainId].clock !== undefined;
    pid = mainId;
  }
}

export function writePgn(tree: MoveTree, headers: PgnHeaders = {}): string {
  const rootFen = tree.nodes[ROOT].fen;
  const all: PgnHeaders = {
    Event: "Analysis",
    Site: "https://wagnerchess.com",
    Date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    White: "?",
    Black: "?",
    Result: "*",
    ...Object.fromEntries(Object.entries(headers).filter(([, v]) => v.trim() !== "")), // empty extra tags are left out
  };
  if (rootFen !== START_FEN) {
    all.SetUp = "1";
    all.FEN = rootFen;
  }

  const head = Object.entries(all)
    .map(([k, v]) => `[${k} "${v.replace(/(["\\])/g, "\\$1")}"]`)
    .join("\n");

  const rootComment = tree.nodes[ROOT].comment ? [`{${tree.nodes[ROOT].comment.replace(/[{}]/g, "")}}`] : [];
  const words = [...rootComment, ...writeLine(tree, ROOT, Boolean(rootComment.length)), all.Result];
  const wrapped: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 80) {
      wrapped.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) wrapped.push(line);

  return `${head}\n\n${wrapped.join("\n")}\n`;
}
