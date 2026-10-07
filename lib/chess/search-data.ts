import { Chess } from "chess.js";

// Small built-in lists for the search of the Analysis Room: well-known openings (as move lists) and basic endgame positions (FEN).
export type OpeningEntry = { eco: string; name: string; moves: string };
export type EndgameEntry = { name: string; fen: string };

export const OPENINGS: OpeningEntry[] = [
  { eco: "C60", name: "Ruy Lopez", moves: "e4 e5 Nf3 Nc6 Bb5" },
  { eco: "C78", name: "Ruy Lopez, Morphy Defence", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O" },
  { eco: "C84", name: "Ruy Lopez, Closed", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7" },
  { eco: "C50", name: "Italian Game", moves: "e4 e5 Nf3 Nc6 Bc4" },
  { eco: "C53", name: "Giuoco Piano", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3" },
  { eco: "C55", name: "Two Knights Defence", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6" },
  { eco: "C44", name: "Scotch Game", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4" },
  { eco: "C42", name: "Petrov's Defence", moves: "e4 e5 Nf3 Nf6" },
  { eco: "C30", name: "King's Gambit", moves: "e4 e5 f4" },
  { eco: "C21", name: "Danish Gambit", moves: "e4 e5 d4 exd4 c3" },
  { eco: "B20", name: "Sicilian Defence", moves: "e4 c5" },
  { eco: "B90", name: "Sicilian, Najdorf", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6" },
  { eco: "B33", name: "Sicilian, Sveshnikov", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5" },
  { eco: "B70", name: "Sicilian, Dragon", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6" },
  { eco: "B23", name: "Sicilian, Closed", moves: "e4 c5 Nc3" },
  { eco: "B10", name: "Caro-Kann Defence", moves: "e4 c6" },
  { eco: "B12", name: "Caro-Kann, Advance", moves: "e4 c6 d4 d5 e5" },
  { eco: "C00", name: "French Defence", moves: "e4 e6" },
  { eco: "C03", name: "French, Tarrasch", moves: "e4 e6 d4 d5 Nd2" },
  { eco: "C11", name: "French, Classical", moves: "e4 e6 d4 d5 Nc3 Nf6" },
  { eco: "B01", name: "Scandinavian Defence", moves: "e4 d5 exd5 Qxd5" },
  { eco: "B07", name: "Pirc Defence", moves: "e4 d6 d4 Nf6 Nc3 g6" },
  { eco: "B02", name: "Alekhine's Defence", moves: "e4 Nf6" },
  { eco: "D06", name: "Queen's Gambit", moves: "d4 d5 c4" },
  { eco: "D30", name: "Queen's Gambit Declined", moves: "d4 d5 c4 e6" },
  { eco: "D20", name: "Queen's Gambit Accepted", moves: "d4 d5 c4 dxc4" },
  { eco: "D10", name: "Slav Defence", moves: "d4 d5 c4 c6" },
  { eco: "D43", name: "Semi-Slav", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 h6" },
  { eco: "E60", name: "King's Indian Defence", moves: "d4 Nf6 c4 g6" },
  { eco: "E97", name: "King's Indian, Classical", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6" },
  { eco: "D80", name: "Grünfeld Defence", moves: "d4 Nf6 c4 g6 Nc3 d5" },
  { eco: "E20", name: "Nimzo-Indian Defence", moves: "d4 Nf6 c4 e6 Nc3 Bb4" },
  { eco: "E12", name: "Queen's Indian Defence", moves: "d4 Nf6 c4 e6 Nf3 b6" },
  { eco: "A45", name: "Trompowsky Attack", moves: "d4 Nf6 Bg5" },
  { eco: "A48", name: "London System", moves: "d4 Nf6 Nf3 g6 Bf4" },
  { eco: "D02", name: "London System (d5)", moves: "d4 d5 Nf3 Nf6 Bf4" },
  { eco: "A10", name: "English Opening", moves: "c4" },
  { eco: "A20", name: "English, Reversed Sicilian", moves: "c4 e5" },
  { eco: "A04", name: "Réti Opening", moves: "Nf3 d5 c4" },
  { eco: "A07", name: "King's Indian Attack", moves: "Nf3 d5 g3" },
  { eco: "A80", name: "Dutch Defence", moves: "d4 f5" },
  { eco: "A56", name: "Benoni Defence", moves: "d4 Nf6 c4 c5 d5" },
  { eco: "A00", name: "Grob Opening", moves: "g4" },
  { eco: "A00", name: "Polish Opening (Sokolsky)", moves: "b4" },
  { eco: "C25", name: "Vienna Game", moves: "e4 e5 Nc3" },
  { eco: "C45", name: "Scotch Game (Schmidt)", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5" },
  { eco: "C41", name: "Philidor Defence", moves: "e4 e5 Nf3 d6" },
  { eco: "C40", name: "Latvian Gambit", moves: "e4 e5 Nf3 f5" },
  { eco: "D00", name: "Blackmar-Diemer Gambit", moves: "d4 d5 e4 dxe4 Nc3 Nf6 f3" },
];

export const ENDGAMES: EndgameEntry[] = [
  { name: "King and queen vs king", fen: "8/8/8/4k3/8/8/8/3QK3 w - - 0 1" },
  { name: "King and rook vs king", fen: "8/8/8/4k3/8/8/8/3RK3 w - - 0 1" },
  { name: "Two bishops vs king", fen: "8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1" },
  { name: "Bishop and knight vs king", fen: "8/8/8/4k3/8/8/8/2B1KN2 w - - 0 1" },
  { name: "King and pawn vs king", fen: "8/8/8/3k4/8/8/4P3/4K3 w - - 0 1" },
  { name: "Lucena position (rook endgame)", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1" },
  { name: "Philidor position (rook endgame)", fen: "3k4/8/r7/3PK3/8/8/R7/8 b - - 0 1" },
];

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function searchOpenings(q: string): OpeningEntry[] {
  const n = norm(q);
  if (!n) return [];
  return OPENINGS.filter((o) => norm(`${o.name} ${o.eco} ${o.moves}`).includes(n)).slice(0, 12);
}
export function searchEndgames(q: string): EndgameEntry[] {
  const n = norm(q);
  if (!n) return [];
  return ENDGAMES.filter((e) => norm(e.name).includes(n)).slice(0, 8);
}
// A pasted position: six FEN fields or at least the piece field with 8 ranks.
export function looksLikeFen(q: string): boolean {
  const s = q.trim();
  if (!/^[pnbrqkPNBRQK1-8]+(\/[pnbrqkPNBRQK1-8]+){7}(\s|$)/.test(s)) return false;
  try {
    new Chess(s.split(/\s+/).length >= 4 ? s : `${s.split(/\s+/)[0]} w - - 0 1`);
    return true;
  } catch {
    return false;
  }
}
export const fullFen = (q: string) => (q.trim().split(/\s+/).length >= 4 ? q.trim() : `${q.trim().split(/\s+/)[0]} w - - 0 1`);

// PGN text of an opening (so it loads with the normal import).
export function openingPgn(o: OpeningEntry): string {
  return `[Event "${o.name}"]\n[ECO "${o.eco}"]\n[Opening "${o.name}"]\n\n${o.moves} *`;
}
