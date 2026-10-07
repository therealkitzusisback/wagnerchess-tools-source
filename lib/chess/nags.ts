// Symbols for moves and positions ("NAG" = numeric annotation glyph, as used in PGN files: $1 = "!", $14 = "⩲" ...).
// One move symbol, one position symbol and the novelty mark can be set per move.

export type NagDef = { nag: number; symbol: string };

// How good was the move?
export const MOVE_NAGS: NagDef[] = [
  { nag: 3, symbol: "!!" },
  { nag: 1, symbol: "!" },
  { nag: 5, symbol: "!?" },
  { nag: 6, symbol: "?!" },
  { nag: 2, symbol: "?" },
  { nag: 4, symbol: "??" },
  { nag: 7, symbol: "□" },
];

// Who stands better after the move?
export const POSITION_NAGS: NagDef[] = [
  { nag: 10, symbol: "=" },
  { nag: 13, symbol: "∞" },
  { nag: 14, symbol: "⩲" },
  { nag: 15, symbol: "⩱" },
  { nag: 16, symbol: "±" },
  { nag: 17, symbol: "∓" },
  { nag: 18, symbol: "+−" },
  { nag: 19, symbol: "−+" },
];

export const NOVELTY_NAG: NagDef = { nag: 146, symbol: "N" };

export const ALL_NAGS: NagDef[] = [...MOVE_NAGS, ...POSITION_NAGS, NOVELTY_NAG];
const MOVE_SET = new Set(MOVE_NAGS.map((n) => n.nag));
const POSITION_SET = new Set(POSITION_NAGS.map((n) => n.nag));

export const nagGroup = (nag: number): "move" | "position" | "novelty" | null =>
  MOVE_SET.has(nag) ? "move" : POSITION_SET.has(nag) ? "position" : nag === NOVELTY_NAG.nag ? "novelty" : null;

export const nagSymbol = (nag: number): string => ALL_NAGS.find((n) => n.nag === nag)?.symbol ?? "";

// Symbols that follow the move ("e4!?"), position symbols and N come after that.
export function nagText(nags: number[] | undefined): { move: string; rest: string } {
  const list = nags ?? [];
  const move = list.filter((n) => MOVE_SET.has(n)).map(nagSymbol).join("");
  const rest = list.filter((n) => !MOVE_SET.has(n)).map(nagSymbol).join(" ");
  return { move, rest };
}

// Toggles a symbol: a symbol of the same group replaces the old one, the same symbol again removes it.
export function toggleNag(nags: number[] | undefined, nag: number): number[] {
  const list = nags ?? [];
  if (list.includes(nag)) return list.filter((n) => n !== nag);
  const group = nagGroup(nag);
  if (group === "novelty") return [...list, nag];
  return [...list.filter((n) => nagGroup(n) !== group), nag];
}

// Symbols that can appear after a move in written form ("e4!?") and their numbers.
export const SUFFIX_NAGS: Record<string, number> = { "!": 1, "?": 2, "!!": 3, "??": 4, "!?": 5, "?!": 6 };
