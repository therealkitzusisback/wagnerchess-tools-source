"use client";

import { Chess } from "chess.js";
import type { DrawShape } from "@lichess-org/chessground/draw";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { EngineLine } from "@/lib/chess/engine";
import { formatScoreUnit, whiteShare } from "@/lib/chess/eval";
import {
  APPEARANCE_KEY, ENGINE_KEY, LAYOUT_KEY, ROOM_KEY, brushKey, brushesFor, cleanAppearance, cleanEngineGlobal, cleanLayout, cleanRoom,
  type EngineSlot,
} from "@/lib/chess/engine-settings";
import { openSettings } from "@/lib/settings/open";
import { KEYBINDS_KEY, KEY_ACTIONS, cleanKeybinds, comboOf, type KeyAction } from "@/lib/chess/keybinds";
import type { SettingsTexts } from "@/lib/settings/texts";
import { useStored } from "@/lib/settings/use-stored";
import type { FolderOption, FolderRow } from "@/lib/chess/folders";
import type { LayoutTexts } from "@/lib/chess/layout-texts";
import { parsePgn, writePgn, type PgnHeaders } from "@/lib/chess/pgn";
import type { ChessTexts } from "@/lib/chess/texts";
import { clockMinutes, clockMinutesEdit, clockToPgn, parseClock } from "@/lib/chess/clock";
import { figurine } from "@/lib/chess/figurine";
import { ROOT, addMove, pathTo, createTree, hasMoves, mainlineEnd, removeNode, canDemote, canPromote, demoteLine, makeMainLine, promoteLine, type MoveTree } from "@/lib/chess/tree";
import { MOVE_NAGS, NOVELTY_NAG, POSITION_NAGS, nagText, toggleNag } from "@/lib/chess/nags";
import { BOARD_COOKIE, boardVars, type BoardTheme } from "@/lib/boards";
import { PIECE_COOKIE, PIECE_NAMES, pieceUrl, type PieceSet } from "@/lib/pieces";
import AddEngineDialog from "./AddEngineDialog";
import { ExportDialog, ImportDialog, SaveDialog } from "./AnalysisDialogs";
import ConfirmDialog from "./ConfirmDialog";
import Board from "./Board";
import EnginePanel, { type EngineReport } from "./EnginePanel";
import Explorer, { type FileRow } from "./Explorer";
import RoomRail, { type RailAction, type RailId } from "./RoomRail";
import { DatabasesDialog, FilesDialog, MoreDialog, SearchDialog, type MoreItem } from "./RoomDialogs";
import type { RailTexts } from "@/lib/chess/rail-texts";
import "./chess.css";

// PGN tags that are always shown in "Game info", and the tags that can be added (the list known from Lichess).
const DEFAULT_TAGS = ["Event", "Site", "Date", "White", "Black", "Result"];
const MORE_TAGS = [
  "WhiteElo", "WhiteTitle", "WhiteTeam", "WhiteFideId", "BlackElo", "BlackTitle", "BlackTeam", "BlackFideId",
  "TimeControl", "Termination", "Round", "Board", "Annotator", "GameId", "ECO", "Opening",
];

export type SaveInput = { id: string | null; title: string; folderId: string | null; pgn: string };
export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export type InitialAnalysis = { id: string; title: string; folderId: string | null; pgn: string };

export default function AnalysisBoard({
  t,
  x,
  r,
  st,
  signedIn,
  isAdmin,
  isPro,
  folders,
  folderRows,
  files,
  initial,
  pieceSets,
  initialPieceId,
  boards,
  initialBoardId,
  onSave,
}: {
  t: ChessTexts;
  x: LayoutTexts;
  r: RailTexts;
  st: SettingsTexts;
  signedIn: boolean;
  isAdmin: boolean;
  isPro: boolean;
  folders: FolderOption[];
  folderRows: FolderRow[];
  files: FileRow[];
  initial: InitialAnalysis | null;
  pieceSets: PieceSet[];
  initialPieceId: string;
  boards: BoardTheme[];
  initialBoardId: string;
  onSave: (input: SaveInput) => Promise<SaveResult>;
}) {
  /* ---------------------------------------------------------------- the analysis */
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const treeRef = useRef<MoveTree | null>(null);
  const headersRef = useRef<PgnHeaders>({});
  const [currentId, setCurrentId] = useState(ROOT);
  const [dirty, setDirty] = useState(false);
  // piece set and board come from the account settings (changed in the Account Settings window, which lives in the header)
  const [appearance] = useStored(APPEARANCE_KEY, cleanAppearance);
  const pieceId = appearance.pieceId || initialPieceId;
  const pieceSet = pieceSets.find((s) => s.id === pieceId) ?? pieceSets[0];
  const boardId = appearance.boardId || initialBoardId;
  const boardTheme = boards.find((x) => x.id === boardId) ?? boards[0];
  const pieceVars = useMemo(
    () =>
      ({
        ...Object.fromEntries(PIECE_NAMES.map((n) => [`--p-${n}`, `url(${pieceUrl(pieceSet, n)})`])),
        ...boardVars(boardTheme),
      }) as React.CSSProperties,
    [pieceSet, boardTheme]
  );
  /* ---------------------------------------------------------------- board size (drag the corner handle) */
  const [boardW, setBoardW] = useState(760);
  const [headersTick, setHeadersTick] = useState(0);
  const [railDialog, setRailDialog] = useState<{ id: RailId; kind?: "all" | "openings" | "endgames" } | null>(null);
  const [dialog, setDialog] = useState<"import" | "export" | "save" | null>(null); // windows opened from the bottom row of "My Analyses"
  const [notationView, setNotationView] = useState<"notation" | "info" | "clocks">("notation");
  const [clockHintHidden, setClockHintHidden] = useState(false); // closed with the cross (until the page is reloaded)
  const [hintDontShow, setHintDontShow] = useState(false);
    const areaRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const saveBoardW = (w: number) => {
    updateLayout({ boardW: w }); // saved with the account: the same on every device
    window.dispatchEvent(new Event("resize")); // lets the board recompute its square positions
  };
  // Tool pages keep a frame as wide as the header is high (FRAME px, same value as --hh in page-titles.css) on all four sides.
  // The board never grows wider than its column and, on a large screen, never taller than the free height (no page scrolling).
  const [room, updateRoom] = useStored(ROOM_KEY, cleanRoom);
  const [engSet, updateEngSet] = useStored(ENGINE_KEY, cleanEngineGlobal);
  const [keys] = useStored(KEYBINDS_KEY, cleanKeybinds);
  const [layout, updateLayout, layoutReady] = useStored(LAYOUT_KEY, cleanLayout);
  const orientation: "white" | "black" = room.flipped ? "black" : "white"; // Analysis Room Settings: "Flip board"
  const FRAME = 96;
  const EVAL_OFF = room.showEvalBar ? 44 : 0; // evaluation bar (36 px) + gap (8 px), none when the bar is switched off
  // The board gets the free height under the header (the frame on top) down to the small gap at the bottom of the page.
  const roomChrome = FRAME + 8;
  const maxBoardW = () => {
    const byWidth = (areaRef.current?.parentElement?.getBoundingClientRect().width ?? 1000) - EVAL_OFF;
    const fit = window.innerWidth >= 1200 && window.innerHeight >= 720;
    return Math.max(280, Math.min(2400, fit ? Math.min(byWidth, window.innerHeight - roomChrome) : byWidth));
  };
  const startResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const el = areaRef.current;
    if (!el) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = el.getBoundingClientRect().width - EVAL_OFF;
    const max = maxBoardW();
    let latest = startW;
    setResizing(true);
    const move = (ev: PointerEvent) => {
      const d = Math.max(ev.clientX - startX, ev.clientY - startY);
      latest = Math.round(Math.min(max, Math.max(280, startW + d)));
      setBoardW(latest);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setResizing(false);
      saveBoardW(latest);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const resizeByKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const grow = e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "+";
    const shrink = e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "-";
    if (!grow && !shrink) return;
    e.preventDefault();
    const w = Math.round(Math.min(maxBoardW(), Math.max(280, boardW + (grow ? 20 : -20))));
    setBoardW(w);
    saveBoardW(w);
  };

  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);

  if (!treeRef.current) {
    let tree = createTree();
    if (initial) {
      try {
        const parsed = parsePgn(initial.pgn);
        tree = parsed.tree;
        headersRef.current = parsed.headers;
      } catch {
        /* an unreadable saved file starts empty */
      }
    }
    treeRef.current = tree;
  }
  const tree = treeRef.current;
  const node = tree.nodes[currentId] ?? tree.nodes[ROOT];

  const chess = useMemo(() => new Chess(node.fen), [node.fen]);
  const turn: "white" | "black" = chess.turn() === "w" ? "white" : "black";
  const gameOver = chess.isGameOver();

  const dests = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of chess.moves({ verbose: true })) {
      const list = map.get(m.from) ?? [];
      if (!list.includes(m.to)) list.push(m.to);
      map.set(m.from, list);
    }
    return map;
  }, [chess]);

  const lastMove = useMemo<[string, string] | undefined>(
    () => (node.uci ? [node.uci.slice(0, 2), node.uci.slice(2, 4)] : undefined),
    [node.uci]
  );

  const play = useCallback(
    (from: string, to: string, promotion?: string) => {
      const c = new Chess(tree.nodes[currentId].fen);
      try {
        const m = c.move({ from, to, promotion });
        const id = addMove(tree, currentId, { san: m.san, uci: from + to + (promotion ?? ""), fen: c.fen() });
        setCurrentId(id);
        setDirty(true);
      } catch {
        rerender();
      }
    },
    [tree, currentId]
  );

  const onBoardMove = useCallback(
    (from: string, to: string) => {
      const c = new Chess(tree.nodes[currentId].fen);
      const legal = c.moves({ verbose: true }).filter((m) => m.from === from && m.to === to);
      if (legal.length === 0) return rerender();
      if (legal.some((m) => m.promotion)) setPending({ from, to });
      else play(from, to);
    },
    [tree, currentId, play]
  );

  /* ---------------------------------------------------------------- navigation */
  const goBack = useCallback(() => {
    const p = tree.nodes[currentId]?.parent;
    if (p) setCurrentId(p);
  }, [tree, currentId]);
  const goForward = useCallback(() => {
    const c = tree.nodes[currentId]?.children[0];
    if (c) setCurrentId(c);
  }, [tree, currentId]);
  const goStart = () => setCurrentId(ROOT);
  const goEnd = () => setCurrentId(mainlineEnd(tree, currentId));

  const deleteMove = () => {
    const back = removeNode(tree, currentId);
    if (back) {
      setCurrentId(back);
      setDirty(true);
    }
  };

  // Lines: promote / demote / make main (buttons under the arrows and the right-click menu of the notation)
  const lineOp = (fn: (t: MoveTree, id: string) => boolean, id: string) => {
    if (fn(tree, id)) {
      setDirty(true);
      rerender();
    }
  };
  const deleteMoveById = (id: string) => {
    const back = removeNode(tree, id);
    if (back) {
      if (!tree.nodes[currentId]) setCurrentId(back);
      setDirty(true);
      rerender();
    }
  };
  // Right-click menu of the notation (a small menu of this website, not the browser's)
  const [noteMenu, setNoteMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  useEffect(() => {
    if (!noteMenu) return;
    const close = () => setNoteMenu(null);
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", key);
    };
  }, [noteMenu]);

  const resetAnalysis = () => {
    treeRef.current = createTree();
    headersRef.current = {};
    setHeadersTick((n) => n + 1);
    setCurrentId(ROOT);
    setDirty(false);
    setFileId(null);
    setHeadersTick((n) => n + 1);
  };
  // Questions are asked in a small window of this website (ConfirmDialog), not with the native browser dialog.
  const [confirmAsk, setConfirmAsk] = useState<{ title: string; message: string; onOk: () => void } | null>(null);
  const newAnalysis = () => {
    if (dirty && hasMoves(tree)) {
      setConfirmAsk({ title: st.dialogs.newAnalysisTitle, message: t.board.confirmNew, onOk: resetAnalysis });
      return;
    }
    resetAnalysis();
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = t.board.leaveWarning;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, t.board.leaveWarning]);

  /* ---------------------------------------------------------------- full page load for the multi-threaded engine */
  // Pro and admin accounts: the multi-threaded engine needs a page that was loaded with special headers ("cross-origin isolated").
  // Arriving by a click inside the site does not have them, so the page loads itself once more. A flag prevents endless reloads.
  useEffect(() => {
    if (!(isAdmin || isPro)) return;
    try {
      if (window.crossOriginIsolated) {
        sessionStorage.removeItem("wc-iso-reload");
        return;
      }
      if (sessionStorage.getItem("wc-iso-reload")) return;
      sessionStorage.setItem("wc-iso-reload", "1");
      window.location.reload();
    } catch {
      /* without storage nothing is reloaded */
    }
  }, [isAdmin, isPro]);

  /* ---------------------------------------------------------------- engine windows */
  // Normal accounts have one engine window; Pro and admin accounts can open up to three.
  const maxEngines = isAdmin || isPro ? 3 : 1;
  const [slots, setSlots] = useState<EngineSlot[]>([{ id: 1, engine: null }]);
  const enginePanels = slots.map((sl) => sl.id);
  const [addEngineOpen, setAddEngineOpen] = useState(false);
  const [freshIds, setFreshIds] = useState<number[]>([]); // windows added in this visit start right away
  const [reports, setReports] = useState<Record<number, EngineReport | null>>({});
  const onReport = useCallback((id: number, r: EngineReport | null) => {
    setReports((cur) => ({ ...cur, [id]: r }));
  }, []);
  // Heights of the windows (relative weights; see dragRows and fitRows below). Left column: "x" = file tree, "e1" ... = engines. Right column: "n" = notation, "c" = comment.
  const [weights, setWeights] = useState<Record<string, number>>({});
  const wOf = (k: string) => weights[k] ?? 100;
  // A new window asks which engine it should use (AddEngineDialog); the list of windows is saved with the account.
  const addEngine = (engineId: string) => {
    const nextId = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((i) => !enginePanels.includes(i));
    if (!nextId || slots.length >= maxEngines) return;
    const keysNow = ["x", ...enginePanels.map((i) => `e${i}`)];
    const avg = keysNow.reduce((a, k) => a + wOf(k), 0) / keysNow.length;
    const nextWeights = { ...weights, [`e${nextId}`]: avg };
    const nextSlots = [...slots, { id: nextId, engine: engineId }];
    setWeights(nextWeights);
    setSlots(nextSlots);
    setFreshIds((f) => [...f, nextId]);
    updateLayout({ weights: nextWeights, engines: nextSlots });
    setAddEngineOpen(false);
  };
  const removeEngine = (id: number) => {
    if (slots.length <= 1) return;
    const nextSlots = slots.filter((sl) => sl.id !== id);
    setSlots(nextSlots);
    updateLayout({ engines: nextSlots });
  };

  // The first window that is switched on drives the evaluation bar and the arrows on the board.
  const primary = enginePanels.map((id) => reports[id]).find((r): r is EngineReport => Boolean(r && r.on));
  const engineOn = Boolean(primary);
  const liveLines: EngineLine[] = primary && primary.fen === node.fen ? primary.lines : [];
  const share = whiteShare(liveLines[0]);
  // Arrow settings come from the engine window that drives the board (mode: all lines / best move only / none; colours per line).
  const arrowColors = engSet.colors;
  const arrowMode = engSet.arrowMode;
  const brushes = useMemo(() => brushesFor([...arrowColors]), [arrowColors]);
  const shapes = useMemo<DrawShape[]>(() => {
    if (!engineOn || arrowMode === "off") return [];
    return liveLines.slice(0, arrowMode === "best" ? 1 : 6).flatMap((l) =>
      l.pv[0]
        ? [{ orig: l.pv[0].slice(0, 2), dest: l.pv[0].slice(2, 4), brush: brushKey(arrowColors[Math.min(l.multipv, 3) - 1]) } as DrawShape]
        : []
    );
  }, [engineOn, liveLines, arrowMode, arrowColors]);

  /* ---------------------------------------------------------------- import / export */
  // Returns an error text, or null when the import worked.
  const doImport = (raw: string): string | null => {
    const text = raw.replace(/^\uFEFF/, "").trim();
    if (!text) return t.tools.importEmpty;
    try {
      let next: MoveTree;
      let headers: PgnHeaders = {};
      const firstPart = text.split(/\s+/)[0] ?? "";
      if (!text.includes("[") && firstPart.split("/").length === 8) {
        new Chess(text); // throws when the FEN is not valid
        next = createTree(text);
      } else {
        const parsed = parsePgn(text);
        next = parsed.tree;
        headers = parsed.headers;
        if (!hasMoves(next) && Object.keys(headers).length === 0) throw new Error("nothing found");
      }
      treeRef.current = next;
      headersRef.current = headers;
      setHeadersTick((n) => n + 1);
      setCurrentId(ROOT);
      setDirty(true);
      setFileId(null);
      setHeadersTick((n) => n + 1);
      rerender();
      return null;
    } catch (e) {
      return `${t.tools.importError} (${e instanceof Error ? e.message : "?"})`;
    }
  };

  const currentPgn = () => writePgn(tree, headersRef.current);
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };
  const mainlineText = () => {
    const out: string[] = [];
    let cur = ROOT;
    while (tree.nodes[cur].children.length > 0) {
      const id = tree.nodes[cur].children[0];
      const parentFen = tree.nodes[cur].fen.split(" ");
      const full = parentFen[5] ?? "1";
      if (parentFen[1] !== "b") out.push(`${full}.`);
      else if (out.length === 0) out.push(`${full}...`);
      out.push(tree.nodes[id].san);
      cur = id;
    }
    return out.join(" ");
  };
  const downloadPgn = () => {
    const url = URL.createObjectURL(new Blob([currentPgn()], { type: "application/x-chess-pgn" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis.pgn";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------------- file tree */
  const router = useRouter();
  const openFile = (id: string) => {
    if (id === fileId) return;
    if (dirty && hasMoves(tree)) {
      setConfirmAsk({ title: st.dialogs.openAnalysisTitle, message: x.explorer.leave, onOk: () => router.push(`/tools/analysisroom?file=${id}`) });
      return;
    }
    router.push(`/tools/analysisroom?file=${id}`);
  };

  /* ---------------------------------------------------------------- column widths (drag the thin bars) */
  const rootRef = useRef<HTMLDivElement>(null);
  const [explW, setExplW] = useState(300);
  const [rightW, setRightW] = useState(420);
  // Board position: with no column on one side, a thin bar at the frame lets you push the board sideways (drag in both directions).
  const [shift, setShift] = useState(0);
  const GUT = 14;
  const dragShift = (e: React.PointerEvent) => {
    e.preventDefault();
    const col = rootRef.current?.querySelector<HTMLElement>(".col-board");
    const max = Math.max(0, (col?.clientWidth ?? 1000) - GUT - (boardW + EVAL_OFF));
    const startX = e.clientX;
    const start = Math.min(shift, max);
    let latest = start;
    const move = (ev: PointerEvent) => {
      latest = Math.round(Math.min(max, Math.max(0, start + ev.clientX - startX)));
      setShift(latest);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      updateLayout({ boardShift: latest });
      window.dispatchEvent(new Event("resize"));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const shiftByKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const col = rootRef.current?.querySelector<HTMLElement>(".col-board");
    const max = Math.max(0, (col?.clientWidth ?? 1000) - GUT - (boardW + EVAL_OFF));
    const w = Math.round(Math.min(max, Math.max(0, shift + (e.key === "ArrowRight" ? 20 : -20))));
    setShift(w);
    updateLayout({ boardShift: w });
  };
  const BOARD_MIN = 380; // the board column never gets narrower than this
  // Upper limit of a side column: everything up to the frame, but the board column keeps its minimum.
  const maxSide = (which: "left" | "right") => {
    const total = rootRef.current?.getBoundingClientRect().width ?? 1600;
    const lc = Math.max(1, leftCols.length);
    const rc = Math.max(1, rightCols.length);
    const other = which === "left" ? rightW * rc : explW * lc;
    return Math.max(300, (total - other - BOARD_MIN - 40 * (lc + rc - 1)) / (which === "left" ? lc : rc));
  };
  const dragColumn = (e: React.PointerEvent, which: "left" | "right") => {
    e.preventDefault();
    const startX = e.clientX;
    const start = which === "left" ? explW : rightW;
    let latest = start;
    const move = (ev: PointerEvent) => {
      const d = ev.clientX - startX;
      const max = maxSide(which);
      if (which === "left") latest = Math.round(Math.min(max, Math.max(180, start + d)));
      else latest = Math.round(Math.min(max, Math.max(300, start - d)));
      (which === "left" ? setExplW : setRightW)(latest);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      updateLayout(which === "left" ? { explW: latest } : { rightW: latest }); // saved with the account
      window.dispatchEvent(new Event("resize"));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const dragByKey = (e: React.KeyboardEvent, which: "left" | "right") => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 20 : -20;
    if (which === "left") {
      const w = Math.round(Math.min(maxSide("left"), Math.max(180, explW + step)));
      setExplW(w);
      updateLayout({ explW: w });
    } else {
      const w = Math.round(Math.min(maxSide("right"), Math.max(300, rightW - step)));
      setRightW(w);
      updateLayout({ rightW: w });
    }
  };

  /* ---------------------------------------------------------------- heights of the windows on the right (drag the thin bars) */
  const rpKeys = () => allKeys.filter(isVisible);
  const measure = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const k of rpKeys()) {
      const el = rootRef.current?.querySelector<HTMLElement>(`[data-rp="${k}"]`);
      out[k] = Math.max(90, el ? el.getBoundingClientRect().height : 100);
    }
    return out;
  };
  const dragRows = (e: React.PointerEvent, upper: string, lower: string) => {
    e.preventDefault();
    const start = measure(); // from now on the weights are real pixel heights, so every window keeps its size
    const startY = e.clientY;
    const total = start[upper] + start[lower];
    setWeights(start);
    let latest = start;
    const move = (ev: PointerEvent) => {
      const up = Math.round(Math.min(total - 90, Math.max(90, start[upper] + ev.clientY - startY)));
      latest = { ...start, [upper]: up, [lower]: total - up };
      setWeights(latest);
    };
    const end = () => {
      updateLayout({ weights: latest }); // saved with the account
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };
  const dragRowsByKey = (e: React.KeyboardEvent, upper: string, lower: string) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const start = measure();
    const total = start[upper] + start[lower];
    const up = Math.round(Math.min(total - 90, Math.max(90, start[upper] + (e.key === "ArrowDown" ? 20 : -20))));
    const next = { ...start, [upper]: up, [lower]: total - up };
    setWeights(next);
    updateLayout({ weights: next });
  };
  // "Fit": every window gets the height of its content (file tree and notation at most 420 px), leftover space is shared proportionally.
  const fitRows = () => {
    const root = rootRef.current;
    if (!root) return;
    // Measure what every window needs for its content, independent of the size it has now: for a moment all windows
    // get "natural" height (class "measuring"), so every click on the button gives exactly the same result.
    root.classList.add("measuring");
    const next: Record<string, number> = {};
    for (const k of rpKeys()) {
      const box = root.querySelector<HTMLElement>(`[data-rp="${k}"] > .panel-box`);
      const natural = box ? Math.ceil(box.getBoundingClientRect().height) : 200;
      next[k] = k === "n" || k === "x" ? Math.min(420, Math.max(140, natural)) : Math.max(120, natural);
    }
    root.classList.remove("measuring");
    setWeights(next);
    updateLayout({ weights: next });
  };

  // Applies the saved layout (sizes of the columns and windows, open engine windows) once, as soon as it is known.
  const layoutApplied = useRef(false);
  useEffect(() => {
    if (!layoutReady || layoutApplied.current) return;
    layoutApplied.current = true;
    let ew = layout.explW;
    let rw = layout.rightW;
    const total = rootRef.current?.getBoundingClientRect().width ?? 0;
    if (total > 0 && window.innerWidth >= 1200) {
      const free = total - BOARD_MIN - 40; // both side columns together may use this much on this screen
      if (ew + rw > free) {
        const f = Math.max(0.3, free / (ew + rw));
        ew = Math.max(180, Math.floor(ew * f));
        rw = Math.max(300, Math.floor(rw * f));
      }
    }
    setExplW(ew);
    setRightW(rw);
    setShift(layout.boardShift);
    setBoardW(layout.boardW >= 280 ? Math.min(layout.boardW, maxBoardW()) : maxBoardW());
    setWeights(layout.weights);
    const restored = layout.engines.slice(0, maxEngines);
    if (restored.length > 0) setSlots(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutReady]);

  /* ---------------------------------------------------------------- keyboard shortcuts (Analysis Room Settings) */
  const goBranch = (dir: 1 | -1) => {
    const parent = tree.nodes[currentId]?.parent;
    if (!parent) return;
    const siblings = tree.nodes[parent].children;
    const next = siblings[siblings.indexOf(currentId) + dir];
    if (next) setCurrentId(next);
  };
  const playBest = () => {
    const best = liveLines[0]?.pv[0];
    if (!best) return;
    if (best.length > 4) play(best.slice(0, 2), best.slice(2, 4), best[4]);
    else onBoardMove(best.slice(0, 2), best.slice(2, 4));
  };
  const runAction = (action: KeyAction) => {
    switch (action) {
      case "back": return goBack();
      case "forward": return goForward();
      case "first": return goStart();
      case "last": return goEnd();
      case "prevBranch": return goBranch(-1);
      case "nextBranch": return goBranch(1);
      case "flip": return updateRoom({ flipped: !room.flipped });
      case "toggleArrows": return updateEngSet({ arrowMode: engSet.arrowMode === "off" ? "all" : "off" });
      case "toggleEngine": return void window.dispatchEvent(new Event("wc-engine-toggle"));
      case "playBest": return playBest();
      case "toggleEvalBar": return updateRoom({ showEvalBar: !room.showEvalBar });
      case "deleteMove": return deleteMove();
      case "help": return openSettings("analysis-room", "wc-keys");
    }
  };
  const actionRef = useRef(runAction);
  actionRef.current = runAction;
  const keyMap = useMemo(() => {
    const m = new Map<string, KeyAction>();
    for (const a of KEY_ACTIONS) for (const k of keys[a]) m.set(k, a);
    return m;
  }, [keys]);
  const keyMapRef = useRef(keyMap);
  keyMapRef.current = keyMap;
  // Scrolling over the board steps through the moves (setting "Scroll on the board").
  const wheelRef = useRef({ on: true, invert: false });
  wheelRef.current = { on: room.wheelMoves, invert: room.wheelInvert };
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    let acc = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      if (!wheelRef.current.on || e.ctrlKey || document.querySelector(".wc-overlay")) return;
      e.preventDefault();
      const now = performance.now();
      if (now - last > 250) acc = 0;
      last = now;
      acc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      if (Math.abs(acc) < 40) return;
      const forward = (acc > 0) !== wheelRef.current.invert;
      acc = 0;
      actionRef.current(forward ? "forward" : "back");
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  useEffect(() => {
    const ignore = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return true;
      return Boolean(document.querySelector(".wc-overlay")); // a settings window is open: the keys belong to it
    };
    const onKey = (e: KeyboardEvent) => {
      if (ignore(e)) return;
      const combo = comboOf(e);
      const action = combo ? keyMapRef.current.get(combo) : undefined;
      if (!action) return;
      e.preventDefault();
      actionRef.current(action);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // keeps a focused button from being "clicked" by the space key when space is a shortcut
      const combo = comboOf(e);
      if (!ignore(e) && combo && keyMapRef.current.has(combo)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  /* ---------------------------------------------------------------- saving */
  const [fileId, setFileId] = useState<string | null>(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.title ?? t.save.defaultTitle);
  const [folderId, setFolderId] = useState<string>(initial?.folderId ?? "");
  const [saving, setSaving] = useState(false);

  // Returns the message shown in the Save window.
  const save = async (asCopy: boolean): Promise<string> => {
    if (!hasMoves(tree)) return t.save.noMoves;
    setSaving(true);
    try {
      const res = await onSave({
        id: asCopy ? null : fileId,
        title,
        folderId: folderId || null,
        pgn: currentPgn(),
      });
      if (res.ok) {
        setFileId(res.id);
        setDirty(false);
        router.refresh(); // updates the file tree on the left
        return t.save.saved;
      }
      return t.save.error;
    } catch {
      return t.save.error;
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- pieces check */
  const [piecesMissing, setPiecesMissing] = useState(false);
  useEffect(() => {
    if (!isAdmin) return;
    fetch(pieceUrl(pieceSet, "wK"), { method: "HEAD" })
      .then((r) => setPiecesMissing(!r.ok))
      .catch(() => setPiecesMissing(true));
  }, [isAdmin, pieceSet]);

  /* ---------------------------------------------------------------- comments and symbols */
  // Text before or after the selected move (the start position has only one text).
  const [commentSide, setCommentSide] = useState<"before" | "after" | "symbols">("after");
  const tab: "before" | "after" | "symbols" = currentId === ROOT ? "after" : commentSide;
  const side: "before" | "after" = tab === "before" ? "before" : "after";
  const setComment = (text: string) => {
    const n = tree.nodes[currentId];
    if (!n) return;
    if (side === "before") n.commentBefore = text === "" ? undefined : text;
    else n.comment = text === "" ? undefined : text;
    setDirty(true);
    rerender();
  };
  const toggleGlyph = (nag: number) => {
    const n = tree.nodes[currentId];
    if (!n || currentId === ROOT) return;
    const next = toggleNag(n.nags, nag);
    n.nags = next.length > 0 ? next : undefined;
    setDirty(true);
    rerender();
  };
  const moveLabel = (id: string) => {
    const n = tree.nodes[id];
    if (!n.parent) return "";
    const parentFen = tree.nodes[n.parent].fen.split(" ");
    const full = parentFen[5] ?? "1";
    return `${parentFen[1] === "b" ? `${full}...` : `${full}.`} ${figurine(n.san, room.figurines)}`;
  };

  /* ---------------------------------------------------------------- move list */
  const moveButton = (id: string, forceNumber: boolean) => {
    const n = tree.nodes[id];
    const parentFen = tree.nodes[n.parent ?? ROOT].fen.split(" ");
    const full = parentFen[5] ?? "1";
    const label = parentFen[1] === "b" ? (forceNumber || n.parent === ROOT || tree.nodes[n.parent ?? ROOT].comment ? `${full}...` : "") : `${full}.`;
    const glyphs = nagText(n.nags);
    return (
      <span key={id}>
        {n.commentBefore && (
          <button type="button" className={`mv-comment${n.commentBefore.includes("\n") ? " multi" : ""}`} onClick={() => { setCommentSide("before"); setCurrentId(id); }} title={x.notation.commentBefore}>
            {n.commentBefore}
          </button>
        )}
        {label && <span className="num">{label}</span>}
        <button type="button" className={`mv${id === currentId ? " active" : ""}`} onClick={() => setCurrentId(id)} onContextMenu={(e) => { e.preventDefault(); setCurrentId(id); setNoteMenu({ x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY, window.innerHeight - 200), id }); }}>
          {figurine(n.san, room.figurines)}
          {glyphs.move}
          {glyphs.rest && <span className="mv-glyph"> {glyphs.rest}</span>}
        </button>{" "}
        {room.showClockTimes && n.clock !== undefined && <span className="mv-clk">{clockShown(n)} </span>}
        {n.comment && (
          <button type="button" className={`mv-comment${n.comment.includes("\n") ? " multi" : ""}`} onClick={() => { setCommentSide("after"); setCurrentId(id); }} title={x.notation.commentAfter}>
            {n.comment}
          </button>
        )}
      </span>
    );
  };

  const renderChildren = (parentId: string, force: boolean): React.ReactNode[] => {
    const children = tree.nodes[parentId].children;
    if (children.length === 0) return [];
    const [main, ...variations] = children;
    const out: React.ReactNode[] = [moveButton(main, force)];
    for (const v of variations) {
      out.push(
        <span key={`v-${v}`} className="variation">
          {moveButton(v, true)}
          {renderChildren(v, false)}
        </span>
      );
    }
    out.push(...renderChildren(main, variations.length > 0));
    return out;
  };

  /* ---------------------------------------------------------------- scoresheet table (rows: number | White | Black) */
  const openNoteMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setCurrentId(id);
    setNoteMenu({ x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY, window.innerHeight - 200), id });
  };
  // What is shown for the time of a move: exact (h:mm:ss) for an imported game, whole minutes for a time typed in by hand.
  const clockShown = (n: { clock?: number; clockMin?: boolean }) => (n.clock === undefined ? "" : n.clockMin ? clockMinutes(n.clock) : clockToPgn(n.clock));
  const commitClock = (id: string, text: string, before: string) => {
    const n = tree.nodes[id];
    if (!n || text.trim() === before) return; // unchanged: keep the exact seconds
    if (!text.trim()) {
      delete n.clock;
      delete n.clockMin;
    } else {
      const secs = parseClock(text);
      if (secs === null) return;
      n.clock = secs;
      n.clockMin = true; // typed in by hand: shown in whole minutes
    }
    setDirty(true);
    rerender();
  };
  const sheetMove = (id: string | undefined, gap: boolean) => {
    if (!id) return <div className={`sheet-cell${gap ? " gap" : ""}`}>{gap ? "…" : null}</div>;
    const n = tree.nodes[id];
    const glyphs = nagText(n.nags);
    return (
      <div className={`sheet-cell${id === currentId ? " active" : ""}`} key={id}>
        <button type="button" className={`mv${id === currentId ? " active" : ""}`} onClick={() => setCurrentId(id)} onContextMenu={(e) => openNoteMenu(e, id)}>
          {figurine(n.san, room.figurines)}
          {glyphs.move}
          {glyphs.rest && <span className="mv-glyph"> {glyphs.rest}</span>}
        </button>
        {room.showClockTimes && n.clock !== undefined && <span className="sheet-clk">{clockShown(n)}</span>}
      </div>
    );
  };
  type SheetItem = { kind: "row"; num: string; w?: string; b?: string; wGap?: boolean; bGap?: boolean } | { kind: "comment"; id: string; side: "before" | "after"; text: string } | { kind: "variation"; id: string };
  // The main line as rows (number | White | Black). Comments and variations of a move stand in their own full-width blocks between the rows;
  // a row that is interrupted continues in the next row with "…".
  const sheetItems = (withBlocks: boolean): SheetItem[] => {
    const items: SheetItem[] = [];
    let row: (SheetItem & { kind: "row" }) | null = null;
    const flush = () => {
      if (row) items.push(row);
      row = null;
    };
    for (let cur = tree.nodes[ROOT].children[0]; cur; cur = tree.nodes[cur].children[0]) {
      const n = tree.nodes[cur];
      const parent = tree.nodes[n.parent ?? ROOT];
      const pf = parent.fen.split(" ");
      const white = pf[1] === "w";
      const num = pf[5] ?? "1";
      if (withBlocks && n.commentBefore) {
        if (row && !white) row.bGap = true;
        flush();
        items.push({ kind: "comment", id: cur, side: "before", text: n.commentBefore });
      }
      if (white) {
        flush();
        row = { kind: "row", num, w: cur };
      } else if (row && row.w && !row.b && row.num === num) {
        row.b = cur;
      } else {
        flush();
        row = { kind: "row", num, wGap: true, b: cur };
      }
      const alts = parent.children.slice(1);
      if (withBlocks && (n.comment || alts.length > 0)) {
        if (white) (row as SheetItem & { kind: "row" }).bGap = true;
        flush();
        if (n.comment) items.push({ kind: "comment", id: cur, side: "after", text: n.comment });
        for (const v of alts) items.push({ kind: "variation", id: v });
      }
    }
    flush();
    return items;
  };
  const sheetView = () => (
    <div className="sheet" role="table">
      {sheetItems(true).map((it, i) =>
        it.kind === "row" ? (
          <div className="sheet-row" role="row" key={`r${i}`}>
            <div className="sheet-num" role="rowheader">{it.num}</div>
            {sheetMove(it.w, Boolean(it.wGap))}
            {sheetMove(it.b, Boolean(it.bGap))}
          </div>
        ) : it.kind === "comment" ? (
          <div className="sheet-block" key={`c${i}`}>
            <button type="button" className="sheet-text" onClick={() => { setCommentSide(it.side); setCurrentId(it.id); }} title={it.side === "before" ? x.notation.commentBefore : x.notation.commentAfter}>{it.text}</button>
          </div>
        ) : (
          <div className="sheet-block var" key={`v${i}`}>
            {moveButton(it.id, true)}
            {renderChildren(it.id, false)}
          </div>
        )
      )}
    </div>
  );
  // "Clock Usage": only for typing in the times. One box per half-move (minutes left after the move).
  const clockEntry = () => (
    <div className="sheet clock-entry" role="table">
      {sheetItems(false).map((it, i) =>
        it.kind === "row" ? (
          <div className="sheet-row" role="row" key={`r${i}`}>
            <div className="sheet-num" role="rowheader">{it.num}</div>
            {[it.w, it.b].map((id, k) => {
              if (!id) return <div className="sheet-cell" key={k} />;
              const n = tree.nodes[id];
              const before = n.clock === undefined ? "" : n.clockMin ? clockMinutesEdit(n.clock) : clockToPgn(n.clock);
              return (
                <label className={`sheet-cell${id === currentId ? " active" : ""}`} key={`${id}-${before}`}>
                  <span className="clk-name">{figurine(n.san, room.figurines)}</span>
                  <input
                    className="clk-input"
                    defaultValue={before}
                    placeholder="min"
                    inputMode="decimal"
                    aria-label={`${x.clock.edit}: ${moveLabel(id)}`}
                    onFocus={(e) => { setCurrentId(id); e.currentTarget.select(); }}
                    onBlur={(e) => commitClock(id, e.currentTarget.value, before)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      e.stopPropagation();
                    }}
                  />
                </label>
              );
            })}
          </div>
        ) : null
      )}
    </div>
  );
  useEffect(() => {
    document.querySelector(".sheet .mv.active, .sheet-cell.active")?.scrollIntoView({ block: "nearest" });
  }, [currentId, notationView]);

  const promoColor = turn === "white" ? "w" : "b";

  const headerValue = (k: string) => headersRef.current[k] ?? "";
  const setHeader = (k: string, v: string) => {
    headersRef.current = { ...headersRef.current, [k]: v };
    setDirty(true);
    rerender();
  };
  // Tags shown in "Game info": the usual ones always, others once they were added (or came with an imported PGN).
  // all tags in the order of the former drop-down list, then any further tags of an imported game
  const tagKeys = [...DEFAULT_TAGS, ...MORE_TAGS, ...Object.keys(headersRef.current).filter((k) => !DEFAULT_TAGS.includes(k) && !MORE_TAGS.includes(k) && k !== "FEN" && k !== "SetUp")];
  const tagLabels: Record<string, string> = { Event: x.info.event, Site: x.info.site, Date: x.info.date, White: x.info.white, Black: x.info.black, Result: x.info.result };

  /* ---------------------------------------------------------------- windows and their places (Pro/Admin can move windows) */
  const canMove = isAdmin || isPro;
  const allKeys = ["x", ...enginePanels.map((i) => `e${i}`), "n", "c"];
  const isVisible = (k: string) => (k === "x" ? room.showFilesWindow : k === "n" ? room.showNotation : k === "c" ? room.showComment : true);
  const isRightKind = (k: string) => k === "n" || k === "c";
  const windowName = (k: string) => (k === "x" ? x.explorer.title : k === "n" ? x.notation.scoresheet : k === "c" ? x.notation.commentTitle : `${x.engines.window} ${k.slice(1)}`);

  // The columns that are drawn, left to right, and how many of them lie left of the board.
  // Standard: file tree + engines left, scoresheet + comment right. Pro/Admin can move windows and create new columns (saved with the account).
  const { cols, boardAt } = (() => {
    const wanted = canMove ? layout.columns : [];
    let list: string[][] = [];
    let at = 0;
    wanted.forEach((c, i) => {
      const kept = c.filter((k) => allKeys.includes(k) && isVisible(k));
      if (kept.length > 0) {
        list.push(kept);
        if (i < layout.boardAt) at += 1;
      }
    });
    const placed = new Set(list.flat());
    const missing = allKeys.filter((k) => isVisible(k) && !placed.has(k));
    if (wanted.length === 0) {
      const left = missing.filter((k) => !isRightKind(k));
      const right = missing.filter(isRightKind);
      list = [left, right].filter((c) => c.length > 0);
      at = left.length > 0 ? 1 : 0;
    } else {
      for (const k of missing) {
        if (list.length === 0) {
          list.push([k]);
          continue;
        }
        let ci = list.findIndex((c) => c.some((q) => (isRightKind(k) ? isRightKind(q) : q === "x" || q[0] === "e")));
        if (ci < 0) ci = isRightKind(k) ? list.length - 1 : 0;
        if (k === "x") list[ci].unshift(k);
        else list[ci].push(k);
      }
    }
    return { cols: list, boardAt: at };
  })();
  const leftCols = cols.slice(0, boardAt);
  const rightCols = cols.slice(boardAt);
  const shiftSide: "left" | "right" | null = leftCols.length === 0 ? "left" : rightCols.length === 0 ? "right" : null;
  const MAX_COLS = 4;

  type NewSpot = "outerLeft" | "boardLeft" | "boardRight" | "outerRight";
  type DropTarget = { kind: "in"; col: number; index: number } | { kind: "new"; at: NewSpot };

  // Puts window k at a place (an existing column, or a new column) and saves it with the account.
  const moveWindow = (k: string, target: DropTarget) => {
    const cs = cols.map((c) => c.filter((q) => q !== k));
    let b = boardAt;
    if (target.kind === "in") {
      cs[target.col].splice(Math.min(target.index, cs[target.col].length), 0, k);
    } else {
      const pos = target.at === "outerLeft" ? 0 : target.at === "outerRight" ? cs.length : b;
      cs.splice(pos, 0, [k]);
      if (target.at === "outerLeft" || target.at === "boardLeft") b += 1;
    }
    const out: string[][] = [];
    let nb = 0;
    cs.forEach((c, i) => {
      if (c.length > 0) {
        out.push(c);
        if (i < b) nb += 1;
      }
    });
    updateLayout({ columns: out, boardAt: nb });
    window.setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  // Dragging a window by its grip: gold marks show where it can be dropped (above/below a window, or as a new column).
  const [drag, setDrag] = useState<{ key: string; x: number; y: number; target: DropTarget | null } | null>(null);
  const canMakeColumn = (k: string) => cols.filter((c) => c.some((q) => q !== k)).length < MAX_COLS;
  const zoneRects = (k: string) => {
    const root = rootRef.current;
    const board = root?.querySelector<HTMLElement>(".col-board");
    if (!root || !board) return [] as { at: NewSpot; left: number; top: number; width: number; height: number }[];
    const rr = root.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    if (!canMakeColumn(k)) return [];
    const w = Math.min(140, br.width * 0.3);
    const out: { at: NewSpot; left: number; top: number; width: number; height: number }[] = [
      { at: "boardLeft", left: br.left, top: rr.top, width: w, height: rr.height },
      { at: "boardRight", left: br.right - w, top: rr.top, width: w, height: rr.height },
    ];
    if (boardAt > 0) out.push({ at: "outerLeft", left: rr.left, top: rr.top, width: 26, height: rr.height });
    if (cols.length - boardAt > 0) out.push({ at: "outerRight", left: rr.right - 26, top: rr.top, width: 26, height: rr.height });
    return out;
  };
  const lineRect = (t: DropTarget & { kind: "in" }, dragKey: string) => {
    const colEl = rootRef.current?.querySelector<HTMLElement>(`.col-side[data-col="${t.col}"]`);
    if (!colEl) return null;
    const rps = Array.from(colEl.querySelectorAll<HTMLElement>("[data-rp]")).filter((el) => el.dataset.rp !== dragKey);
    const cr = colEl.getBoundingClientRect();
    if (rps.length === 0) return { left: cr.left, top: cr.top - 3, width: cr.width, height: 6 };
    const y = t.index < rps.length ? rps[t.index].getBoundingClientRect().top - 7 : rps[rps.length - 1].getBoundingClientRect().bottom + 7;
    return { left: cr.left, top: y - 3, width: cr.width, height: 6 };
  };
  const hitTest = (cx: number, cy: number, dragKey: string): DropTarget | null => {
    const root = rootRef.current;
    if (!root) return null;
    const zones = zoneRects(dragKey);
    const inside = (z: { left: number; top: number; width: number; height: number }) => cx >= z.left && cx <= z.left + z.width && cy >= z.top && cy <= z.top + z.height;
    const outer = zones.find((z) => (z.at === "outerLeft" || z.at === "outerRight") && inside(z));
    if (outer) return { kind: "new", at: outer.at };
    const els = Array.from(root.querySelectorAll<HTMLElement>(".col-side"));
    for (const el of els) {
      const cr = el.getBoundingClientRect();
      if (cx >= cr.left - 8 && cx <= cr.right + 8 && cy >= cr.top - 10 && cy <= cr.bottom + 10) {
        const rps = Array.from(el.querySelectorAll<HTMLElement>("[data-rp]")).filter((q) => q.dataset.rp !== dragKey);
        return { kind: "in", col: Number(el.dataset.col), index: rps.filter((q) => { const r = q.getBoundingClientRect(); return r.top + r.height / 2 < cy; }).length };
      }
    }
    const strip = zones.find((z) => (z.at === "boardLeft" || z.at === "boardRight") && inside(z));
    return strip ? { kind: "new", at: strip.at } : null;
  };
  const startDrag = (e: React.PointerEvent, key: string) => {
    if (!canMove || e.button > 0) return;
    e.preventDefault();
    let target: DropTarget | null = null;
    setDrag({ key, x: e.clientX, y: e.clientY, target });
    document.body.classList.add("wc-dragging");
    const move = (ev: PointerEvent) => {
      target = hitTest(ev.clientX, ev.clientY, key);
      setDrag({ key, x: ev.clientX, y: ev.clientY, target });
    };
    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      document.body.classList.remove("wc-dragging");
      setDrag(null);
      if (ev.type === "pointerup" && target) moveWindow(key, target);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };
  // Keyboard: arrow up/down = one place in the column, arrow left/right = next column (or a new column at the edge).
  const moveByKey = (e: React.KeyboardEvent, key: string) => {
    const ci = cols.findIndex((c) => c.includes(key));
    if (ci < 0) return;
    const at = cols[ci].indexOf(key);
    if (e.key === "ArrowUp" && at > 0) moveWindow(key, { kind: "in", col: ci, index: at - 1 });
    else if (e.key === "ArrowDown" && at < cols[ci].length - 1) moveWindow(key, { kind: "in", col: ci, index: at + 1 });
    else if (e.key === "ArrowLeft" && ci > 0) moveWindow(key, { kind: "in", col: ci - 1, index: Math.min(at, cols[ci - 1].length) });
    else if (e.key === "ArrowRight" && ci < cols.length - 1) moveWindow(key, { kind: "in", col: ci + 1, index: Math.min(at, cols[ci + 1].length) });
    else if (e.key === "ArrowLeft" && ci === 0 && cols[0].length > 1 && canMakeColumn(key)) moveWindow(key, { kind: "new", at: boardAt > 0 ? "outerLeft" : "boardLeft" });
    else if (e.key === "ArrowRight" && ci === cols.length - 1 && cols[ci].length > 1 && canMakeColumn(key)) moveWindow(key, { kind: "new", at: cols.length - boardAt > 0 ? "outerRight" : "boardRight" });
    else return;
    e.preventDefault();
  };
  const gripFor = (k: string) =>
    canMove ? (
      <button type="button" className="move-handle" onPointerDown={(e) => startDrag(e, k)} onKeyDown={(e) => moveByKey(e, k)} aria-label={`${x.move.handle}: ${windowName(k)}`} title={x.move.handle}>
        <svg viewBox="0 0 12 16" aria-hidden="true"><g fill="currentColor"><circle cx="3.5" cy="3" r="1.4" /><circle cx="8.5" cy="3" r="1.4" /><circle cx="3.5" cy="8" r="1.4" /><circle cx="8.5" cy="8" r="1.4" /><circle cx="3.5" cy="13" r="1.4" /><circle cx="8.5" cy="13" r="1.4" /></g></svg>
      </button>
    ) : null;

  // The content of one window.
  const windowBody = (k: string): React.ReactNode => {
    const handle = gripFor(k);
    if (k === "x") {
      return (
            <Explorer
              folders={folderRows}
              files={files}
              activeFileId={fileId}
              signedIn={signedIn}
              x={x}
              onOpen={openFile}
              onNew={newAnalysis}
              onExport={() => setDialog("export")}
              onImport={() => setDialog("import")}
              onSave={() => setDialog("save")}
              handle={handle}
            />
      );
    }
    if (k === "n") {
      return (
            <section className="panel-box notation">
              <div className="notation-head">
                <div className="head-left">{handle}<h2>{x.notation.scoresheet}</h2></div>
                <button type="button" className="fit-btn" onClick={fitRows} aria-label={x.engineUi.fit} title={x.engineUi.fit}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div className="view-switch tab-row" role="tablist">
                <button type="button" role="tab" aria-selected={notationView === "clocks"} className={notationView === "clocks" ? "on" : ""} onClick={() => setNotationView("clocks")}>{x.tabs.clocks}</button>
                <button type="button" role="tab" aria-selected={notationView === "info"} className={notationView === "info" ? "on" : ""} onClick={() => setNotationView("info")}>{x.tabs.info}</button>
                <button type="button" role="tab" aria-selected={notationView === "notation"} className={notationView === "notation" ? "on" : ""} onClick={() => setNotationView("notation")}>{x.notation.title}</button>
              </div>
              {notationView === "info" ? (
                <div className="info-panel">
                  <div className="info-rows">
                    {tagKeys.map((k) => (
                      <div className="info-row" key={`${k}-${headersTick}`}>
                        <label htmlFor={`tag-${k}`}>{tagLabels[k] ?? k}</label>
                        {k === "Result" ? (
                          <select id={`tag-${k}`} defaultValue={headerValue(k) || "*"} onChange={(e) => setHeader(k, e.target.value)}>
                            <option value="*">{x.info.resultNone}</option>
                            <option value="1-0">1-0</option>
                            <option value="0-1">0-1</option>
                            <option value="1/2-1/2">1/2-1/2</option>
                          </select>
                        ) : (
                          <input id={`tag-${k}`} defaultValue={headerValue(k)} onChange={(e) => setHeader(k, e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="panel-note">{x.info.note}</p>
                </div>
              ) : (
                <>
              <div className="move-list">
                {tree.nodes[ROOT].comment && (
                  <button type="button" className={`mv-comment${(tree.nodes[ROOT].comment ?? "").includes("\n") ? " multi" : ""}`} onClick={() => setCurrentId(ROOT)}>{tree.nodes[ROOT].comment}</button>
                )}
                {notationView === "clocks" && room.hintClock && !clockHintHidden && (
                  <div className="clock-hint" role="note">
                    <button type="button" className="clock-hint-x" aria-label={x.clock.hideHint} title={x.clock.hideHint} onClick={() => { if (hintDontShow) updateRoom({ hintClock: false }); else setClockHintHidden(true); }}>✕</button>
                    <p>{x.clock.hint}</p>
                    <label className="clock-hint-check"><input type="checkbox" checked={hintDontShow} onChange={(e) => setHintDontShow(e.target.checked)} /> {x.clock.dontShow}</label>
                  </div>
                )}
                {!hasMoves(tree) ? <span className="panel-note">{x.notation.empty}</span> : notationView === "clocks" ? clockEntry() : room.scoresheetTable ? sheetView() : renderChildren(ROOT, !!tree.nodes[ROOT].comment)}
              </div>
              <div className="notation-nav">
                <button type="button" onClick={goStart} disabled={currentId === ROOT} aria-label={t.board.start} title={t.board.start}>⏮</button>
                <button type="button" onClick={goBack} disabled={currentId === ROOT} aria-label={t.board.back} title={t.board.back}>◀</button>
                <button type="button" onClick={goForward} disabled={node.children.length === 0} aria-label={t.board.forward} title={t.board.forward}>▶</button>
                <button type="button" onClick={goEnd} disabled={node.children.length === 0} aria-label={t.board.end} title={t.board.end}>⏭</button>
              </div>
              <div className="notation-actions" role="group" aria-label={x.notation.promote}>
                <button type="button" onClick={() => lineOp(promoteLine, currentId)} disabled={!canPromote(tree, currentId)} title={x.notation.promote}>↑ {x.notation.promote}</button>
                <button type="button" onClick={() => lineOp(demoteLine, currentId)} disabled={!canDemote(tree, currentId)} title={x.notation.demote}>↓ {x.notation.demote}</button>
                <button type="button" onClick={() => lineOp(makeMainLine, currentId)} disabled={!canPromote(tree, currentId)} title={x.notation.makeMain}>★ {x.notation.makeMain}</button>
              </div>
                </>
              )}
            </section>
      );
    }
    if (k === "c") {
      return (
            <section className="panel-box comment-window">
              <div className="head-left">{handle}<h2>{x.notation.commentTitle}</h2></div>
              <p className="comment-for">{currentId === ROOT ? x.notation.commentStart : `${x.notation.commentOf} ${moveLabel(currentId)}`}</p>
              {currentId !== ROOT && (
                <div className="view-switch tab-row comment-side" role="tablist" aria-label={x.notation.commentTitle}>
                  <button type="button" role="tab" aria-selected={tab === "before"} className={tab === "before" ? "on" : ""} onClick={() => setCommentSide("before")}>
                    {x.notation.commentBefore}{node.commentBefore ? " •" : ""}
                  </button>
                  <button type="button" role="tab" aria-selected={tab === "after"} className={tab === "after" ? "on" : ""} onClick={() => setCommentSide("after")}>
                    {x.notation.commentAfter}{node.comment ? " •" : ""}
                  </button>
                  <button type="button" role="tab" aria-selected={tab === "symbols"} className={tab === "symbols" ? "on" : ""} onClick={() => setCommentSide("symbols")}>
                    {x.notation.symbolsTab}{node.nags?.length ? " •" : ""}
                  </button>
                </div>
              )}
              {tab === "symbols" && currentId !== ROOT ? (
              <div className="comment-symbols" role="group" aria-label={x.notation.symbolsMove}>
                <div className="sym-row" role="group" aria-label={x.notation.symbolsMove}>
                  {MOVE_NAGS.map((g) => (
                    <button
                      key={g.nag}
                      type="button"
                      className={node.nags?.includes(g.nag) ? "on" : ""}
                      aria-pressed={Boolean(node.nags?.includes(g.nag))}
                      disabled={currentId === ROOT}
                      title={x.notation.nags[String(g.nag)]}
                      aria-label={x.notation.nags[String(g.nag)]}
                      onClick={() => toggleGlyph(g.nag)}
                    >
                      {g.symbol}
                    </button>
                  ))}
                </div>
                <div className="sym-row" role="group" aria-label={x.notation.symbolsPosition}>
                  {[...POSITION_NAGS, NOVELTY_NAG].map((g) => (
                    <button
                      key={g.nag}
                      type="button"
                      className={node.nags?.includes(g.nag) ? "on" : ""}
                      aria-pressed={Boolean(node.nags?.includes(g.nag))}
                      disabled={currentId === ROOT}
                      title={x.notation.nags[String(g.nag)]}
                      aria-label={x.notation.nags[String(g.nag)]}
                      onClick={() => toggleGlyph(g.nag)}
                    >
                      {g.symbol}
                    </button>
                  ))}
                </div>
              </div>
              ) : (
              <textarea
                className="comment-text"
                value={(side === "before" ? node.commentBefore : node.comment) ?? ""}
                maxLength={2000}
                placeholder={x.notation.commentPlaceholder}
                aria-label={x.notation.commentTitle}
                onChange={(e) => setComment(e.target.value)}
              />
              )}
            </section>
      );
    }
    const id = Number(k.slice(1));
    const slotIndex = slots.findIndex((sl) => sl.id === id);
    const engine = slots[slotIndex]?.engine ?? null;
    return (
                <EnginePanel
                  id={id}
                  engine={engine}
                  startOn={freshIds.includes(id) || Boolean(reports[id]?.on)}
                  fen={node.fen}
                  gameOver={gameOver}
                  t={t}
                  x={x}
                  st={st}
                  removable={enginePanels.length > 1}
                  onRemove={() => removeEngine(id)}
                  onReport={onReport}
                  onPlay={onBoardMove}
                  handle={handle}
                  addButton={
                    slotIndex === slots.length - 1
                      ? {
                          label: enginePanels.length < maxEngines ? x.engines.add : maxEngines === 1 ? x.engines.proOnly : x.engines.maxReached,
                          disabled: enginePanels.length >= maxEngines,
                          onClick: () => setAddEngineOpen(true),
                        }
                      : undefined
                  }
                />
    );
  };
  // One column of windows. The column next to the board carries the drag bar for the width of that side.
  const sideColumn = (keys: string[], ci: number) => {
    const isLeft = ci < boardAt;
    const nextToBoard = isLeft ? ci === boardAt - 1 : ci === boardAt;
    return (
      <div className={`col-side ${isLeft ? "col-left" : "col-right"}`} data-col={ci} key={`col-${ci}-${keys[0]}`}>
        {!isLeft && nextToBoard && (
          <div
            className="col-split right"
            role="separator"
            aria-orientation="vertical"
            aria-label={x.notation.resizeRight}
            title={x.notation.resizeRight}
            tabIndex={0}
            onPointerDown={(e) => dragColumn(e, "right")}
            onKeyDown={(e) => dragByKey(e, "right")}
          />
        )}
        <div className="side-panel">{renderColumn(keys)}</div>
        {isLeft && nextToBoard && (
          <div
            className="col-split left"
            role="separator"
            aria-orientation="vertical"
            aria-label={x.explorer.resize}
            title={x.explorer.resize}
            tabIndex={0}
            onPointerDown={(e) => dragColumn(e, "left")}
            onKeyDown={(e) => dragByKey(e, "left")}
          />
        )}
      </div>
    );
  };
  const renderColumn = (keys: string[]) =>
    keys.map((k, i) => (
      <Fragment key={k}>
        {i > 0 && (
          <div
            className="row-split"
            role="separator"
            aria-orientation="horizontal"
            aria-label={x.engineUi.resizeRows}
            title={x.engineUi.resizeRows}
            tabIndex={0}
            onPointerDown={(e) => dragRows(e, keys[i - 1], k)}
            onKeyDown={(e) => dragRowsByKey(e, keys[i - 1], k)}
          />
        )}
        <div className={`rp${drag?.key === k ? " dragging" : ""}`} data-rp={k} style={{ "--w": wOf(k) } as React.CSSProperties}>
          {windowBody(k)}
        </div>
      </Fragment>
    ));

  /* ---------------------------------------------------------------- left rail */
  const railFiles = {
    onOpen: (id: string) => { setRailDialog(null); openFile(id); },
    onNew: () => { setRailDialog(null); newAnalysis(); },
  };
  const loadFen = (fen: string) => doImport(fen);
  const pasteFen = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      const err = doImport(text);
      if (err) setRailDialog({ id: "search", kind: "all" });
    } catch {
      setRailDialog({ id: "search", kind: "all" });
    }
  };
  const railActions: Record<RailId, RailAction[]> = {
    files: [
      { label: r.menu.newAnalysis, run: newAnalysis },
      { label: r.menu.importPgn, run: () => setDialog("import") },
      { label: r.menu.save, run: () => setDialog("save") },
      { label: r.menu.export, run: () => setDialog("export") },
      { label: r.menu.manage, run: () => router.push("/tools/library") },
    ],
    databases: [
      { label: r.menu.openDb, run: () => setRailDialog({ id: "databases" }) },
      { label: r.menu.searchInDb, run: () => setRailDialog({ id: "search", kind: "all" }) },
      { label: r.menu.dbSettings, run: () => openSettings("analysis-room") },
    ],
    search: [
      { label: r.menu.pasteFen, run: pasteFen },
      { label: r.menu.searchOpenings, run: () => setRailDialog({ id: "search", kind: "openings" }) },
      { label: r.menu.searchEndgames, run: () => setRailDialog({ id: "search", kind: "endgames" }) },
    ],
    more: [
      { label: r.menu.flip, run: () => updateRoom({ flipped: !room.flipped }) },
      { label: r.menu.engineSettings, run: () => openSettings("engine") },
      { label: r.menu.settings, run: () => openSettings("analysis-room") },
      { label: r.menu.keys, run: () => openSettings("analysis-room", "wc-keys") },
    ],
  };
  const moreItems: MoreItem[] = [
    { group: "file", label: r.m.newAnalysis, run: newAnalysis },
    { group: "file", label: r.m.importPgn, run: () => setDialog("import") },
    { group: "file", label: r.m.save, run: () => setDialog("save") },
    { group: "file", label: r.m.export, run: () => setDialog("export") },
    { group: "file", label: r.m.library, run: () => {}, href: "/tools/library" },
    { group: "board", label: r.m.flip, run: () => updateRoom({ flipped: !room.flipped }) },
    { group: "site", label: r.m.settings, run: () => openSettings("analysis-room") },
    { group: "site", label: r.m.engineSettings, run: () => openSettings("engine") },
    { group: "site", label: r.m.keys, run: () => openSettings("analysis-room", "wc-keys") },
  ];

  return (
    <>
    {room.showRail && <RoomRail t={r} onOpen={(id) => setRailDialog({ id, kind: "all" })} actions={railActions} />}
    <div
      className="analysis three"
      ref={rootRef}
      style={{ "--grid-cols": `${leftCols.map(() => "var(--expl-w)").join(" ")} minmax(0, 1fr) ${rightCols.map(() => "var(--right-w)").join(" ")}`.trim(), "--expl-w": `${explW}px`, "--right-w": `${rightW}px`, "--room-chrome": `${roomChrome}px`, "--eval-col": room.showEvalBar ? "36px" : "0px", "--eval-gap": room.showEvalBar ? "8px" : "0px", "--eval-off": `${EVAL_OFF}px` } as React.CSSProperties}
    >
      {leftCols.map((keys, i) => sideColumn(keys, i))}

      <div className="col-board" style={{ "--board-w": `${boardW}px` } as React.CSSProperties}>
        {shiftSide && (
          <div
            className={`board-gutter ${shiftSide}`}
            role="separator"
            aria-orientation="vertical"
            aria-label={x.boardShift}
            title={x.boardShift}
            tabIndex={0}
            style={shiftSide === "left" ? { left: Math.min(shift, 4000) } : undefined}
            onPointerDown={dragShift}
            onKeyDown={shiftByKey}
          />
        )}
        <div className="board-shift" style={shiftSide === "left" ? { marginLeft: `min(${shift + GUT}px, 60%)` } : shiftSide === "right" ? { marginLeft: `min(${shift}px, 60%)`, marginRight: GUT } : undefined}>
        <div className={`board-area${room.showEvalBar ? "" : " no-eval"}`} ref={areaRef}>
          {room.showEvalBar && (
          <div className="eval-bar" aria-hidden="true">
            {engineOn && (
              <>
                <div
                  className="eval-white"
                  style={orientation === "white" ? { height: `${share * 100}%` } : { height: `${share * 100}%`, top: 0, bottom: "auto" }}
                />
                {liveLines[0] && (
                  <span className={`eval-text ${share >= 0.5 ? "bottom" : "top"}`} style={orientation === "black" ? { top: share >= 0.5 ? 3 : "auto", bottom: share >= 0.5 ? "auto" : 3 } : undefined}>
                    {room.showBarNumber ? formatScoreUnit(liveLines[0], engSet.scoreUnit, true) : null}
                  </span>
                )}
              </>
            )}
          </div>
          )}
          <div className="board-wrap">
            <Board
              fen={node.fen}
              orientation={orientation}
              turn={turn}
              check={chess.inCheck()}
              lastMove={lastMove}
              dests={gameOver ? new Map() : dests}
              shapes={shapes}
              brushes={brushes}
              pieceVars={pieceVars}
              showLegal={room.showLegal}
              showCoords={room.showCoords}
              onMove={onBoardMove}
            />
            <button
              type="button"
              className={`board-resize${resizing ? " dragging" : ""}`}
              onPointerDown={startResize}
              onKeyDown={resizeByKey}
              aria-label={t.board.resizeBoard}
              title={t.board.resizeBoard}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M11 5L5 11M11 8.5L8.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
            </button>
          </div>
        </div>
        {piecesMissing && <p className="panel-note">{t.board.piecesMissing}</p>}
        </div>
      </div>

      {rightCols.map((keys, i) => sideColumn(keys, boardAt + i))}
      {drag && (
        <>
          {zoneRects(drag.key).map((z) => (
            <div key={z.at} className={`drop-zone${drag.target?.kind === "new" && drag.target.at === z.at ? " on" : ""}`} style={{ left: z.left, top: z.top, width: z.width, height: z.height }}>
              {z.width > 60 ? x.move.newColumn : ""}
            </div>
          ))}
          {drag.target?.kind === "in" && (() => {
            const r = lineRect(drag.target, drag.key);
            return r ? <div className="drop-line" style={r} /> : null;
          })()}
          <div className="drag-ghost" style={{ left: drag.x + 14, top: drag.y + 10 }}>{windowName(drag.key)}</div>
        </>
      )}
      {noteMenu && tree.nodes[noteMenu.id] && (
        <div className="lm-menu" role="menu" style={{ left: noteMenu.x, top: noteMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button type="button" role="menuitem" disabled={!canPromote(tree, noteMenu.id)} onClick={() => { lineOp(promoteLine, noteMenu.id); setNoteMenu(null); }}>{x.notation.promote}</button>
          <button type="button" role="menuitem" disabled={!canDemote(tree, noteMenu.id)} onClick={() => { lineOp(demoteLine, noteMenu.id); setNoteMenu(null); }}>{x.notation.demote}</button>
          <button type="button" role="menuitem" disabled={!canPromote(tree, noteMenu.id)} onClick={() => { lineOp(makeMainLine, noteMenu.id); setNoteMenu(null); }}>{x.notation.makeMain}</button>
          <button type="button" role="menuitem" className="danger" onClick={() => { deleteMoveById(noteMenu.id); setNoteMenu(null); }}>{x.notation.deleteMove}</button>
        </div>
      )}

      {confirmAsk && (
        <ConfirmDialog
          title={confirmAsk.title}
          message={confirmAsk.message}
          okLabel={st.dialogs.ok}
          cancelLabel={st.dialogs.cancel}
          closeLabel={st.close}
          onOk={() => { const ok = confirmAsk.onOk; setConfirmAsk(null); ok(); }}
          onCancel={() => setConfirmAsk(null)}
        />
      )}
      {addEngineOpen && <AddEngineDialog st={st} onPick={addEngine} onClose={() => setAddEngineOpen(false)} />}

      {dialog === "import" && (
        <ImportDialog t={t} x={x} closeLabel={st.close} cancelLabel={st.dialogs.cancel} onImport={doImport} onClose={() => setDialog(null)} />
      )}
      {dialog === "export" && (
        <ExportDialog
          t={t}
          x={x}
          closeLabel={st.close}
          onCopyPgn={() => copy(currentPgn())}
          onDownload={downloadPgn}
          onCopyFen={() => copy(node.fen)}
          onCopyMoves={() => copy(mainlineText())}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "save" && (
        <SaveDialog
          t={t}
          x={x}
          closeLabel={st.close}
          signedIn={signedIn}
          folders={folders}
          title={title}
          setTitle={setTitle}
          folderId={folderId}
          setFolderId={setFolderId}
          hasFile={Boolean(fileId)}
          saving={saving}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}

      {railDialog?.id === "files" && (
        <FilesDialog
          x={x} r={r} closeLabel={st.close} folders={folderRows} files={files} activeFileId={fileId} signedIn={signedIn}
          onOpen={railFiles.onOpen} onNew={railFiles.onNew}
          onExport={() => { setRailDialog(null); setDialog("export"); }}
          onImport={() => { setRailDialog(null); setDialog("import"); }}
          onSave={() => { setRailDialog(null); setDialog("save"); }}
          onClose={() => setRailDialog(null)}
        />
      )}
      {railDialog?.id === "databases" && (
        <DatabasesDialog
          r={r} closeLabel={st.close} signedIn={signedIn} isPro={isPro || isAdmin}
          onMine={() => setRailDialog({ id: "files" })}
          onOpenings={() => setRailDialog({ id: "search", kind: "openings" })}
          onEndgames={() => setRailDialog({ id: "search", kind: "endgames" })}
          onClose={() => setRailDialog(null)}
        />
      )}
      {railDialog?.id === "search" && (
        <SearchDialog r={r} closeLabel={st.close} initialKind={railDialog.kind ?? "all"} onPgn={doImport} onFen={loadFen} onClose={() => setRailDialog(null)} />
      )}
      {railDialog?.id === "more" && <MoreDialog r={r} closeLabel={st.close} items={moreItems} onClose={() => setRailDialog(null)} />}

      {pending && (
        <div className="promo" role="dialog" aria-label={t.board.promoteTitle} onClick={() => setPending(null)}>
          <div className="promo-box" onClick={(e) => e.stopPropagation()}>
            <strong>{t.board.promoteTitle}</strong>
            <div className="promo-row">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={p}
                  style={{ backgroundImage: `url(${pieceUrl(pieceSet, promoColor + p.toUpperCase())})` }}
                  onClick={() => {
                    play(pending.from, pending.to, p);
                    setPending(null);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
