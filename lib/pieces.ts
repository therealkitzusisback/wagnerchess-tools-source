// Piece sets of the website.
//
// PUBLIC sets (adminOnly: false): files in /public/pieces/<id>/ (wK wQ wR wB wN wP bK bQ bR bB bN bP, .svg).
// ADMIN sets (adminOnly: true): stored inside lib/private-pieces.generated.ts and served by /api/pieces/<id>/<file>
// only to admin accounts. Nobody else can open them, not even by guessing the address.
//
// Defaults: admin accounts start with "fritz", all other accounts with "merida".
export type PieceSet = {
  id: string;
  name: string;
  ext: "png" | "svg" | "webp";
  author: string;
  license: string; // short name, e.g. "GPLv2+"
  licenseUrl: string; // official page of the licence
  licenseKey: string; // key in lib/piece-license-texts.ts ("" = no full text embedded, e.g. Creative Commons)
  copyright: string; // copyright notice as given by the source
  source: string; // where the original files come from
  modified: string; // "" = unchanged, otherwise a short description of OUR changes
  adminOnly: boolean;
};

const GPL2 = "https://www.gnu.org/licenses/gpl-2.0.txt";
const GPL3 = "https://www.gnu.org/licenses/gpl-3.0.html";
const AGPL3 = "https://www.gnu.org/licenses/agpl-3.0.html";
const MONGE = "https://github.com/maurimo/chess-art";
const lila = (id: string) => `https://github.com/lichess-org/lila/tree/master/public/piece/${id}`;

type PubOpts = { key: string; copyright: string; source: string; modified?: string };
const pub = (id: string, name: string, author: string, license: string, licenseUrl: string, o: PubOpts): PieceSet => ({
  id, name, ext: "svg", author, license, licenseUrl, licenseKey: o.key, copyright: o.copyright, source: o.source,
  modified: o.modified ?? "", adminOnly: false,
});
const adm = (id: string, name: string, ext: "png" | "svg" = "svg"): PieceSet => ({
  id, name, ext, author: "", license: "", licenseUrl: "", licenseKey: "", copyright: "", source: "", modified: "", adminOnly: true,
});

// RULE: every PUBLIC set needs author, licence, copyright and source filled in here. The licence page
// (/tools/licenses) is generated from this list, so adding a set here is all it takes to credit it.
export const PIECE_SETS: PieceSet[] = [
  adm("fritz", "Fritz", "png"),
  pub("merida", "Merida", "Armando Hernandez Marroquin", "GPLv2+", GPL2, { key: "gpl2", copyright: "© Armando Hernandez Marroquin", source: lila("merida") }),
  pub("cburnett", "Cburnett", "Colin M.L. Burnett", "GPLv2+", GPL2, { key: "gpl2", copyright: "© Colin M.L. Burnett", source: lila("cburnett") }),
  pub("celtic", "Celtic", "Maurizio Monge", "MIT", "https://github.com/maurimo/chess-art/blob/main/LICENSE", { key: "mit-monge", copyright: "Copyright (c) Maurizio Monge", source: MONGE }),
  pub("chessnut", "Chessnut", "Alexis Luengas", "Apache 2.0", "https://github.com/LexLuengas/chessnut-pieces/blob/master/LICENSE.txt", { key: "apache2", copyright: "Copyright 2015 Alexis Luengas", source: "https://github.com/LexLuengas/chessnut-pieces" }),
  pub("fantasy", "Fantasy", "Maurizio Monge", "MIT", "https://github.com/maurimo/chess-art/blob/main/LICENSE", { key: "mit-monge", copyright: "Copyright (c) Maurizio Monge", source: MONGE }),
  pub("letter", "Letter", "usolando", "AGPLv3+", AGPL3, { key: "agpl3", copyright: "© usolando", source: lila("letter") }),
  pub("mono", "Mono", "Thibault Duplessis and Colin M.L. Burnett", "GPLv2+", GPL2, {
    key: "gpl2", copyright: "© Thibault Duplessis and Colin M.L. Burnett", source: lila("mono"),
    modified: "Colours adapted: the pieces are drawn in a light and a dark colour so both sides can be told apart.",
  }),
  pub("mpchess", "MPChess", "Maxime Chupin", "GPLv3+", GPL3, { key: "gpl3", copyright: "© Maxime Chupin", source: lila("mpchess") }),
  pub("papercut", "Papercut", "Nikolay Anzarov", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/", { key: "", copyright: "© Nikolay Anzarov (https://nikoichu.itch.io/)", source: lila("papercut") }),
  pub("pirouetti", "Pirouetti", "pirouetti", "AGPLv3+", AGPL3, { key: "agpl3", copyright: "© pirouetti (https://lichess.org/@/pirouetti)", source: lila("pirouetti") }),
  pub("pixel", "Pixel", "therealqtpi", "AGPLv3+", AGPL3, { key: "agpl3", copyright: "© therealqtpi", source: lila("pixel") }),
  pub("shapes", "Shapes", "flugsio", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", { key: "", copyright: "© flugsio", source: "https://github.com/flugsio/chess_shapes" }),
  pub("spatial", "Spatial", "Maurizio Monge", "MIT", "https://github.com/maurimo/chess-art/blob/main/LICENSE", { key: "mit-monge", copyright: "Copyright (c) Maurizio Monge", source: MONGE }),
  adm("alpha", "Alpha"),
  adm("cardinal", "Cardinal"),
  adm("companion", "Companion"),
  adm("kosal", "Kosal"),
  adm("leipzig", "Leipzig"),
  adm("maestro", "Maestro"),
];

export const PIECE_COOKIE = "pieces";
export const PIECE_NAMES = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"] as const;

export function allowedSets(isAdmin: boolean): PieceSet[] {
  return PIECE_SETS.filter((s) => isAdmin || !s.adminOnly);
}

// The set to use: the visitor's choice if allowed, otherwise the default (Fritz for admins, Merida for everybody else).
export function pickSet(sets: PieceSet[], wanted: string | undefined, isAdmin: boolean): PieceSet {
  const byId = (id: string) => sets.find((s) => s.id === id);
  return (wanted ? byId(wanted) : undefined) ?? byId(isAdmin ? "fritz" : "merida") ?? sets[0];
}

// Address of one picture. Admin sets come through the admin-checked route, public sets are plain files.
export function pieceUrl(set: PieceSet, name: string): string {
  return set.adminOnly ? `/api/pieces/${set.id}/${name}.${set.ext}` : `/pieces/${set.id}/${name}.${set.ext}`;
}
