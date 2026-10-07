// Board designs of the website (all PUBLIC, from the Lichess project, files in /public/boards/).
// Defaults: Maple for normal accounts, Wood for admin accounts.
// RULE: every board needs author, licence, copyright and source here. /tools/licenses is generated from this list.
export type BoardTheme = {
  id: string;
  name: string;
  file: string; // file name inside /public/boards/
  author: string;
  license: string;
  licenseUrl: string;
  licenseKey: string; // key in lib/piece-license-texts.ts
  copyright: string;
  source: string;
  modified: string; // "" = unchanged
};

const LILA_BOARDS = "https://github.com/lichess-org/lila/tree/master/public/images/board";
const b = (id: string, name: string, file: string): BoardTheme => ({
  id, name, file,
  author: "the lila authors and pirouetti",
  license: "AGPLv3+",
  licenseUrl: "https://www.gnu.org/licenses/agpl-3.0.html",
  licenseKey: "agpl3",
  copyright: "© the lila authors and pirouetti (https://lichess.org/@/pirouetti)",
  source: LILA_BOARDS,
  modified: "",
});

export const BOARD_THEMES: BoardTheme[] = [
  b("blue", "Blue", "blue.png"),
  b("blue2", "Blue 2", "blue2.jpg"),
  b("blue3", "Blue 3", "blue3.jpg"),
  b("blue-marble", "Blue marble", "blue-marble.jpg"),
  b("brown", "Brown", "brown.png"),
  b("canvas2", "Canvas", "canvas2.jpg"),
  b("green", "Green", "green.png"),
  b("green-plastic", "Green plastic", "green-plastic.png"),
  b("grey", "Grey", "grey.jpg"),
  b("horsey", "Horsey", "horsey.jpg"),
  b("ic", "IC", "ic.png"),
  b("leather", "Leather", "leather.jpg"),
  b("maple", "Maple", "maple.jpg"),
  b("maple2", "Maple 2", "maple2.jpg"),
  b("marble", "Marble", "marble.jpg"),
  b("metal", "Metal", "metal.jpg"),
  b("ncf-board", "NCF board", "ncf-board.png"),
  b("newspaper", "Newspaper", "newspaper.svg"),
  b("olive", "Olive", "olive.jpg"),
  b("pink-pyramid", "Pink pyramid", "pink-pyramid.png"),
  b("purple", "Purple", "purple.png"),
  b("purple-diag", "Purple diagonal", "purple-diag.png"),
  b("wood", "Wood", "wood.jpg"),
  b("wood2", "Wood 2", "wood2.jpg"),
  b("wood3", "Wood 3", "wood3.jpg"),
  b("wood4", "Wood 4", "wood4.jpg"),
];

export const BOARD_COOKIE = "board";

// The board to use: the visitor's choice if it exists, otherwise Wood for admins and Maple for everybody else.
export function pickBoard(wanted: string | undefined, isAdmin: boolean): BoardTheme {
  const byId = (id: string) => BOARD_THEMES.find((x) => x.id === id);
  return (wanted ? byId(wanted) : undefined) ?? byId(isAdmin ? "wood" : "maple") ?? BOARD_THEMES[0];
}

// CSS variables for the board component (see chess.css).
export function boardVars(theme: BoardTheme): Record<string, string> {
  return { "--board-img": `url(/boards/${theme.file})`, "--board-size": "100% 100%" };
}
