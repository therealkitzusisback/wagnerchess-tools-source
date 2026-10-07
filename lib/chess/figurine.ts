// Figurine notation: the piece letter of a move (K Q R B N) is written as a chess piece symbol.
// Always the outlined symbols, whatever the colour of the moving side (as on printed scoresheets).
const SYMBOLS: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘" };

export function figurine(san: string, on: boolean = true): string {
  if (!on) return san;
  return san.replace(/^[KQRBN]/, (c) => SYMBOLS[c]).replace(/=([QRBN])/, (_m, c: string) => `=${SYMBOLS[c]}`);
}
