// Settings of the engine windows. Two kinds:
//  - global engine settings (arrows, colours, display, memory): one set for all windows, edited in "Engine Settings"
//  - window settings (lines, search limit): every engine window has its own
// Both are saved in the visitor's own browser. Room settings (evaluation bar ...) are at the bottom.

export type ArrowMode = "all" | "best" | "off";
export type LimitMode = "depth" | "time" | "infinite";
export const TIME_STEPS = [1, 5, 10, 50, 100];
export const MAX_SECONDS = 12 * 3600; // longest analysis time: 12 hours
export type ScoreUnit = "pawns" | "winpct";

export type EngineGlobal = {
  arrowMode: ArrowMode;
  colors: [string, string, string]; // arrow colour of line 1, 2 and 3 (line 3 is also used for every further line)
  moves: number; // half-moves shown per line
  hash: number; // MB
  threads: number; // processor cores for the multi-threaded engines; 0 = automatic
  defaultEngine: string; // engine id of the window that opens with the page (see lib/chess/engines.ts)
  startOnLoad: boolean; // start the default engine as soon as the page has loaded (default: off)
  timeStep: number; // seconds added or removed by one click on + or - in time mode
  showLines: boolean; // false = the window shows only the evaluation, no moves
  scoreUnit: ScoreUnit;
  timer: "down" | "up" | "off"; // clock in an engine window that analyses for a set time
};

export type EngineWindow = { multipv: number; limit: LimitMode; depth: number; seconds: number };

export type RoomSettings = {
  showEvalBar: boolean; showBarNumber: boolean; flipped: boolean;
  showCoords: boolean; // the numbers 1-8 and letters A-H on the board
  showLegal: boolean; // clicking a piece shows its legal squares
  showFilesWindow: boolean; showNotation: boolean; showComment: boolean; // which windows are visible
  showClockTimes: boolean; // times of the moves in the notation
  figurines: boolean; // piece symbols (♘f3) instead of letters (Nf3) in the notation and the engine lines
  hintClock: boolean; // show the help text in the "Clock Usage" tab
  scoresheetTable: boolean; // notation as a paper-like table (number | White | Black); off = running text with variations
  showRail: boolean; // the bar at the left edge (files, databases, search, more)
  wheelMoves: boolean; wheelInvert: boolean; // scrolling on the board steps through the moves
}; // flipped = board seen from Black's side

export const DEFAULT_COLORS: [string, string, string] = ["#15781b", "#003088", "#4d7fc4"];
export const HASH_CHOICES = [16, 32, 64, 128, 256, 512];

export const ENGINE_KEY = "engineSettings";
export const ROOM_KEY = "roomSettings";
export const windowKey = (id: number) => `engineWindow.${id}`;

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const asObject = (raw: unknown): Record<string, unknown> => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

export function cleanEngineGlobal(raw: unknown): EngineGlobal {
  const r = asObject(raw);
  const colors = Array.isArray(r.colors) ? r.colors : [];
  return {
    arrowMode: r.arrowMode === "best" || r.arrowMode === "off" ? r.arrowMode : "all",
    colors: [0, 1, 2].map((i) => (typeof colors[i] === "string" && HEX.test(colors[i] as string) ? (colors[i] as string).toLowerCase() : DEFAULT_COLORS[i])) as [string, string, string],
    moves: clamp(r.moves, 2, 30, 8),
    hash: HASH_CHOICES.includes(Number(r.hash)) ? Number(r.hash) : 64,
    threads: clamp(r.threads, 0, 64, 0),
    defaultEngine: typeof r.defaultEngine === "string" ? r.defaultEngine : r.strength === "full" ? "stockfish-full" : "stockfish-lite",
    startOnLoad: r.startOnLoad === true,
    timeStep: TIME_STEPS.includes(Number(r.timeStep)) ? Number(r.timeStep) : 5,
    showLines: r.showLines !== false,
    scoreUnit: r.scoreUnit === "winpct" ? "winpct" : "pawns",
    timer: r.timer === "up" || r.timer === "off" ? r.timer : "down",
  };
}

// Number of cores the multi-threaded engine really uses: the chosen number, or (automatic) all cores but one, at most 16.
export function resolveThreads(setting: number, cores: number): number {
  const max = Math.max(1, Math.min(64, cores || 1));
  return setting > 0 ? Math.min(setting, max) : Math.max(1, Math.min(16, max - 1));
}

export const DEFAULT_ENGINE_GLOBAL: EngineGlobal = cleanEngineGlobal(null);

export const windowCleaner = (id: number) => (raw: unknown): EngineWindow => {
  const r = asObject(raw);
  return {
    multipv: clamp(r.multipv, 1, 6, id === 1 ? 3 : 1),
    limit: r.limit === "time" || r.limit === "infinite" ? r.limit : "depth",
    depth: clamp(r.depth, 1, 99, 22),
    seconds: clamp(r.seconds, 1, MAX_SECONDS, 30),
  };
};

// Window layout of the Analysis Room (follows the account to every device).
export type EngineSlot = { id: number; engine: string | null }; // engine null = the default engine
export type LayoutSettings = {
  boardW: number; // 0 = as large as the screen allows
  explW: number;
  rightW: number;
  weights: Record<string, number>; // relative heights of the windows on the right ("x" = file tree, "e1" ... = engines below it; "n" = notation, "c" = comments)
  engines: EngineSlot[];
  columns: string[][]; // Pro/Admin can move windows: the windows of every column, from left to right (empty = the standard places)
  boardAt: number; // how many of these columns lie left of the board
  boardShift: number; // space (px) between the frame and the board when there is no column on that side
};
export const LAYOUT_KEY = "layout";
const WINDOW_KEY = /^(n|c|x|e[1-9])$/;
// Columns of windows (at most 4, every window once). Also reads the older "dock/order" form of the layout.
function cleanColumns(r: Record<string, unknown>): { columns: string[][]; boardAt: number } {
  const seen = new Set<string>();
  let columns: string[][] = (Array.isArray(r.columns) ? r.columns : [])
    .map((c) => (Array.isArray(c) ? c : []).filter((k): k is string => typeof k === "string" && WINDOW_KEY.test(k) && !seen.has(k) && (seen.add(k), true)))
    .filter((c) => c.length > 0)
    .slice(0, 4);
  let boardAt = Math.min(columns.length, Math.max(0, Math.round(Number(r.boardAt)) || 0));
  if (columns.length === 0 && r.dock && typeof r.dock === "object") {
    const dock = r.dock as Record<string, unknown>;
    const order = (Array.isArray(r.order) ? r.order : []).filter((k): k is string => typeof k === "string");
    const rank = (k: string) => (order.includes(k) ? order.indexOf(k) : 99);
    const side = (v: string) => Object.keys(dock).filter((k) => dock[k] === v && WINDOW_KEY.test(k)).sort((a, b) => rank(a) - rank(b));
    columns = [side("left"), side("right")].filter((c) => c.length > 0);
    boardAt = side("left").length > 0 ? 1 : 0;
  }
  return { columns, boardAt };
}
export function cleanLayout(raw: unknown): LayoutSettings {
  const r = asObject(raw);
  const w = asObject(r.weights);
  const weights: Record<string, number> = {};
  for (const [k, v] of Object.entries(w)) if (/^(n|c|x|e[1-9])$/.test(k) && Number.isFinite(Number(v))) weights[k] = Math.min(5000, Math.max(90, Number(v)));
  const slots: EngineSlot[] = [];
  for (const e of Array.isArray(r.engines) ? r.engines : []) {
    const o = asObject(e);
    const id = Number(o.id);
    if (Number.isInteger(id) && id >= 1 && id <= 9 && !slots.some((x) => x.id === id) && slots.length < 3) slots.push({ id, engine: typeof o.engine === "string" ? o.engine : null });
  }
  if (!slots.some((x) => x.id === 1)) slots.unshift({ id: 1, engine: null });
  const bw = Number(r.boardW);
  return {
    boardW: Number.isFinite(bw) && bw >= 280 && bw <= 2400 ? Math.round(bw) : 0,
    explW: clamp(r.explW, 180, 1200, 360),
    rightW: clamp(r.rightW, 300, 1200, 420),
    weights,
    engines: slots.slice(0, 3),
    boardShift: clamp(r.boardShift, 0, 2000, 0),
    ...cleanColumns(r),
  };
}

// Piece set and board design (also kept in cookies, so the server can draw the first picture correctly).
export type Appearance = { pieceId: string; boardId: string }; // "" = not chosen yet
export const APPEARANCE_KEY = "appearance";
export const cleanAppearance = (raw: unknown): Appearance => {
  const r = asObject(raw);
  return { pieceId: typeof r.pieceId === "string" ? r.pieceId.slice(0, 40) : "", boardId: typeof r.boardId === "string" ? r.boardId.slice(0, 40) : "" };
};

export function cleanRoom(raw: unknown): RoomSettings {
  const r = asObject(raw);
  return {
    showEvalBar: r.showEvalBar !== false, showBarNumber: r.showBarNumber !== false, flipped: r.flipped === true,
    showCoords: r.showCoords !== false, showLegal: r.showLegal !== false,
    showFilesWindow: r.showFilesWindow === true, // new name: older saved values of the file window are ignored, it is hidden by default (the left rail has the files)
    showClockTimes: r.showClockTimes !== false, showRail: r.showRail !== false, scoresheetTable: r.scoresheetTable !== false, figurines: r.figurines !== false, hintClock: r.hintClock !== false, wheelMoves: r.wheelMoves !== false, wheelInvert: r.wheelInvert === true, showNotation: r.showNotation !== false, showComment: r.showComment !== false,
  };
}

// Chessground draws arrows with "brushes". One brush per colour; the key contains the colour so a changed colour is a new brush.
export const brushKey = (color: string) => `c${color.replace("#", "").toLowerCase()}`;
export function brushesFor(colors: string[]): Record<string, { key: string; color: string; opacity: number; lineWidth: number }> {
  const out: Record<string, { key: string; color: string; opacity: number; lineWidth: number }> = {};
  colors.forEach((c, i) => {
    out[brushKey(c)] = { key: brushKey(c), color: c, opacity: i === 0 ? 0.85 : 0.7, lineWidth: i === 0 ? 11 : 8 };
  });
  return out;
}
