"use client";

import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { DrawShape } from "@lichess-org/chessground/draw";
import type { Key } from "@lichess-org/chessground/types";
import { useEffect, useRef } from "react";
import "./vendor-chessground.css";

export type BoardProps = {
  fen: string;
  orientation: "white" | "black";
  turn: "white" | "black";
  check: boolean;
  lastMove?: [string, string];
  dests: Map<string, string[]>;
  shapes: DrawShape[];
  brushes?: Record<string, { key: string; color: string; opacity: number; lineWidth: number }>;
  pieceVars: React.CSSProperties;
  showLegal?: boolean; // clicking a piece shows its legal squares
  showCoords?: boolean; // numbers 1-8 and letters A-H
  onMove: (from: string, to: string) => void;
};

// The board itself (Lichess "chessground"). Created once; every change is passed on with api.set().
export default function Board({ fen, orientation, turn, check, lastMove, dests, shapes, brushes, pieceVars, showLegal = true, showCoords = true, onMove }: BoardProps) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const moveRef = useRef(onMove);
  moveRef.current = onMove;

  useEffect(() => {
    if (!host.current) return;
    api.current = Chessground(host.current, {
      fen,
      orientation,
      coordinates: true,
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: true, check: true },
      movable: {
        free: false,
        color: turn,
        dests: dests as Map<Key, Key[]>,
        showDests: showLegal,
        events: { after: (from, to) => moveRef.current(from, to) },
      },
      draggable: { showGhost: true },
      drawable: { enabled: true, autoShapes: shapes, brushes } as never,
    });
    return () => {
      api.current?.destroy();
      api.current = null;
    };
    // The board is created once on purpose; the effect below keeps it up to date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.current?.set({
      fen,
      orientation,
      turnColor: turn,
      check,
      lastMove: lastMove as [Key, Key] | undefined,
      movable: { color: turn, dests: dests as Map<Key, Key[]>, showDests: showLegal },
    });
  }, [fen, orientation, turn, check, lastMove, dests, showLegal]);

  // Arrow colours: each colour is its own brush (the key contains the colour), so a new colour simply adds a brush.
  useEffect(() => {
    if (brushes) api.current?.set({ drawable: { brushes } } as never);
    api.current?.setAutoShapes(shapes);
  }, [shapes, brushes]);

  return (
    <div className={`board-square${showCoords ? "" : " no-coords"}`} style={pieceVars}>
      <div ref={host} className="board-host" />
    </div>
  );
}
