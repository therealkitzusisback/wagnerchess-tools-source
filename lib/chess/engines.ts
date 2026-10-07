import type { EngineManifest } from "@/lib/chess/engine";

// The engines a visitor can choose from.
// "multi" = the multi-threaded build: it uses several processor cores. Pro and admin accounts only; it needs the page to be
// "cross-origin isolated" (the headers are set in proxy.ts for /tools/analysisroom).
export type EngineDef = { id: string; family: "stockfish"; variant: "lite" | "full"; multi?: boolean };

export const ENGINES: EngineDef[] = [
  { id: "stockfish-lite", family: "stockfish", variant: "lite" },
  { id: "stockfish-full", family: "stockfish", variant: "full" },
  { id: "stockfish-lite-multi", family: "stockfish", variant: "lite", multi: true },
  { id: "stockfish-full-multi", family: "stockfish", variant: "full", multi: true },
];

export const DEFAULT_ENGINE = "stockfish-lite";
// canMulti = false (normal accounts): the multi-threaded engines are not available and fall back to the first engine.
export const engineById = (id: string | null | undefined, canMulti = true): EngineDef =>
  ENGINES.find((e) => e.id === id && (canMulti || !e.multi)) ?? ENGINES[0];

// The file of an engine, if it is installed on the site.
export function engineFile(def: EngineDef, m: EngineManifest | null | undefined): { file: string; sizeMB: number } | null {
  if (!m) return null;
  const entry = def.multi ? (def.variant === "full" ? m.fullMulti : m.liteMulti) : def.variant === "full" ? m.full : m.lite;
  return entry ?? null;
}

// "Stockfish 19.0.0 Lite", "Stockfish 19.0.0 Lite (multi-thread)"
export function engineName(def: EngineDef, m: EngineManifest | null | undefined): string {
  return `Stockfish${m?.version ? ` ${m.version}` : ""} ${def.variant === "full" ? "Full" : "Lite"}${def.multi ? " (multi-thread)" : ""}`;
}
