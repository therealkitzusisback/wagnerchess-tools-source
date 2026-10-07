import { Chess } from "chess.js";
import type { EngineLine } from "./engine";

// Chance that White is winning, 0 to 1 (same curve idea as common analysis boards).
export function whiteShare(line: EngineLine | null | undefined): number {
  if (!line) return 0.5;
  if (line.mate !== null) return line.mate > 0 ? 1 : line.mate < 0 ? 0 : 0.5;
  const cp = Math.max(-1000, Math.min(1000, line.cp ?? 0));
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

export function formatScore(line: EngineLine): string {
  if (line.mate !== null) return line.mate > 0 ? `#${line.mate}` : `#-${Math.abs(line.mate)}`;
  const pawns = (line.cp ?? 0) / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

// Short score for the narrow evaluation bar: one decimal ("+0.4"), whole pawns from 10 on ("+12"), mate as "#3".
export function formatBarScore(line: EngineLine): string {
  if (line.mate !== null) return `#${Math.abs(line.mate)}`;
  const pawns = (line.cp ?? 0) / 100;
  const abs = Math.abs(pawns);
  const text = abs >= 10 ? String(Math.round(abs)) : abs.toFixed(1);
  return `${pawns > 0 && abs >= 0.05 ? "+" : pawns < 0 && abs >= 0.05 ? "-" : ""}${text}`;
}

// Same scores, but as the chance that White wins ("54%") when the visitor prefers that unit. Mate stays "#3".
export function formatScoreUnit(line: EngineLine, unit: "pawns" | "winpct", bar = false): string {
  if (unit === "winpct" && line.mate === null) return `${Math.round(whiteShare(line) * 100)}%`;
  return bar ? formatBarScore(line) : formatScore(line);
}

export type PvMove = { number: string; san: string; white: boolean; uci: string };

// Turns the engine's move list (e2e4 e7e5 ...) into readable moves with move numbers.
export function pvToMoves(fen: string, pv: string[], maxPlies = 10): PvMove[] {
  const out: PvMove[] = [];
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return out;
  }
  const parts = fen.split(" ");
  let fullmove = Number(parts[5] ?? "1") || 1;

  for (const uci of pv.slice(0, maxPlies)) {
    const white = chess.turn() === "w";
    let move;
    try {
      move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
    } catch {
      break;
    }
    out.push({
      number: white ? `${fullmove}.` : out.length === 0 ? `${fullmove}...` : "",
      san: move.san,
      white,
      uci,
    });
    if (!white) fullmove += 1;
  }
  return out;
}
