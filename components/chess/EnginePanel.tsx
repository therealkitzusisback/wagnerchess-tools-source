"use client";

import { useEffect, useRef, useState } from "react";
import { UciEngine, type EngineLine, type EngineManifest } from "@/lib/chess/engine";
import { figurine } from "@/lib/chess/figurine";
import { ENGINE_KEY, MAX_SECONDS, ROOM_KEY, cleanEngineGlobal, cleanRoom, resolveThreads, windowCleaner, windowKey, type LimitMode } from "@/lib/chess/engine-settings";
import { ENGINES, engineById, engineFile, engineName } from "@/lib/chess/engines";
import { loadManifest } from "@/lib/chess/manifest";
import { formatScoreUnit, pvToMoves } from "@/lib/chess/eval";
import type { LayoutTexts } from "@/lib/chess/layout-texts";
import type { ChessTexts } from "@/lib/chess/texts";
import type { SettingsTexts } from "@/lib/settings/texts";
import { useStored } from "@/lib/settings/use-stored";
import { useCanMulti } from "@/components/settings/SettingsProvider";
import { openSettings } from "@/lib/settings/open";
import { GearIcon, Stepper } from "@/components/settings/ui";
import SettingsDialog from "@/components/settings/SettingsDialog";

export type EngineReport = { on: boolean; lines: EngineLine[]; fen: string };
type Status = "off" | "loading" | "ready" | "error" | "missing" | "reload" | "consent";

// The visitor agrees once per engine file (and browser) to the download; the browser then keeps the file.
const OK_KEY = "wc-engine-ok:";
const downloadAccepted = (file: string) => {
  try { return localStorage.getItem(OK_KEY + file) === "1"; } catch { return false; }
};
const rememberAccepted = (file: string) => {
  try { localStorage.setItem(OK_KEY + file, "1"); } catch { /* then the question comes again next time */ }
};
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
};

// One engine window (like the "Kibitz" windows in ChessBase). Every window runs its own engine inside the visitor's browser.
// The gear opens "Engine Settings" (arrows, colours, display ... shared by all windows); lines and search limit belong to this window.
export default function EnginePanel({
  id, engine, startOn, fen, gameOver, t, x, st, removable, onRemove, onReport, onPlay, addButton, handle,
}: {
  handle?: React.ReactNode; // grip for moving the window (Pro/Admin)
  id: number;
  engine: string | null; // engine id chosen for this window; null = the default engine
  startOn?: boolean; // true only for a window the visitor has just added: it starts right away
  fen: string;
  gameOver: boolean;
  t: ChessTexts;
  x: LayoutTexts;
  st: SettingsTexts;
  removable: boolean;
  onRemove: () => void;
  onReport: (id: number, report: EngineReport | null) => void;
  onPlay: (from: string, to: string) => void;
  addButton?: { label: string; disabled: boolean; onClick: () => void }; // "＋" in the head of the last window (add another engine window)
}) {
  const u = x.engineUi;
  const [on, setOn] = useState(Boolean(startOn));
  const [status, setStatus] = useState<Status>("off");
  const [manifest, setManifest] = useState<EngineManifest | null>(null);
  const [lines, setLines] = useState<EngineLine[]>([]);
  const [linesFen, setLinesFen] = useState("");
  const engineRef = useRef<UciEngine | null>(null);
  const [ask, setAsk] = useState<{ file: string; sizeMB: number } | null>(null); // download question
  const [okTick, setOkTick] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null); // start of the running timed search
  const [now, setNow] = useState(0);
  const [g, , gReady] = useStored(ENGINE_KEY, cleanEngineGlobal);
  const [room] = useStored(ROOM_KEY, cleanRoom);
  const [w, updateWindow] = useStored(windowKey(id), windowCleaner(id));
  const canMulti = useCanMulti();
  const def = engineById(engine ?? g.defaultEngine, canMulti);
  // If the multi-threaded engine cannot start in this browser, the single-threaded engine of the same size takes over.
  const [fellBack, setFellBack] = useState(false);
  useEffect(() => setFellBack(false), [def.id]);
  const runDef = fellBack ? ENGINES.find((e) => !e.multi && e.variant === def.variant) ?? def : def;
  const { hash, moves, showLines, scoreUnit } = g;
  const { multipv, limit, depth, seconds } = w;

  // Engines are off when a page opens; the default engine only starts by itself if the visitor switched that on in the Engine Settings.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (id === 1 && gReady && g.startOnLoad && !autoStarted.current) {
      autoStarted.current = true;
      setOn(true);
    }
  }, [id, gReady, g.startOnLoad]);
  // Keyboard shortcut "Engine on/off" (sent by the Analysis Room) switches the first window.
  useEffect(() => {
    if (id !== 1) return;
    const toggle = () => setOn((v) => !v);
    window.addEventListener("wc-engine-toggle", toggle);
    return () => window.removeEventListener("wc-engine-toggle", toggle);
  }, [id]);

  useEffect(() => {
    if (!on) {
      setStatus("off");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setStatus("loading");
    (async () => {
      const m = await loadManifest();
      if (cancelled) return;
      if (!m) return setStatus("missing");
      setManifest(m);
      const choice = engineFile(runDef, m);
      if (!choice) return setStatus("missing");
      // The multi-threaded engine needs a "cross-origin isolated" page (headers from proxy.ts). After a click inside the site the
      // page may not have them yet: then one reload of the page fixes it.
      if (runDef.multi && !window.crossOriginIsolated) return setStatus("reload");
      if (!downloadAccepted(choice.file)) {
        setAsk({ file: choice.file, sizeMB: choice.sizeMB });
        return setStatus("consent");
      }
      let ready = false;
      const failed = () => {
        if (cancelled) return;
        if (runDef.multi) setFellBack(true);
        else setStatus("error");
      };
      try {
        engineRef.current = new UciEngine(
          `/engine/${choice.file}`,
          () => {
            ready = true;
            if (!cancelled) setStatus("ready");
          },
          failed
        );
        // a multi-threaded engine that does not answer within 20 seconds is replaced by the single-threaded one
        if (runDef.multi) timer = setTimeout(() => !ready && failed(), 20000);
      } catch {
        failed();
      }
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [on, def.id, fellBack, okTick]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || status !== "ready") return;
    if (gameOver) {
      engine.stop();
      setLines([]);
      setStartedAt(null);
      return;
    }
    setLines([]);
    setStartedAt(Date.now());
    engine.analyse({
      fen,
      multipv,
      depth: limit === "depth" ? depth : null,
      movetimeMs: limit === "time" ? seconds * 1000 : null,
      hash,
      threads: runDef.multi ? resolveThreads(g.threads, navigator.hardwareConcurrency || 1) : undefined,
      onLines: (l) => {
        setLines(l);
        setLinesFen(fen);
      },
    });
  }, [status, fen, multipv, limit, depth, seconds, hash, g.threads, gameOver, fellBack]);

  // Clock of a timed search: counts down or up (Engine Settings), or is not shown.
  const timed = on && status === "ready" && limit === "time" && startedAt !== null && g.timer !== "off";
  useEffect(() => {
    if (!timed) return;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [timed, startedAt]);
  const elapsedMs = timed ? Math.min(seconds * 1000, Math.max(0, now - (startedAt ?? now))) : 0;

  const live = linesFen === fen ? lines : [];
  // The window is named after its engine, e.g. "Stockfish 19.0.0 Lite".
  const title = engineName(def, manifest);

  useEffect(() => {
    onReport(id, { on, lines: live, fen });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, lines, linesFen, fen]);
  useEffect(() => () => onReport(id, null), [id, onReport]);

  return (
    <section className="panel-box engine-window">
      <div className="engine-head">
        <div className="head-left">{handle}<h2>{title}</h2></div>
        <div className="engine-tools">
          <button type="button" className="icon-btn" aria-label={st.engine.title} title={st.engine.title} onClick={() => openSettings("engine")}>
            <GearIcon />
          </button>
          {addButton && (
            <button type="button" className="icon-btn" onClick={addButton.onClick} disabled={addButton.disabled} aria-label={addButton.label} title={addButton.label}>＋</button>
          )}
          {removable && (
            <button type="button" className="icon-btn" onClick={onRemove} aria-label={x.engines.remove} title={x.engines.remove}>✕</button>
          )}
        </div>
      </div>


      <div className="engine-row">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={u.switchLabel}
          title={on ? t.engine.on : t.engine.off}
          className="wc-switch"
          onClick={() => setOn((v) => !v)}
        />
        <span className="engine-field">
          <span className="field-label">{t.engine.lines}</span>
          <Stepper value={multipv} min={1} max={6} onChange={(v) => updateWindow({ multipv: v })} label={t.engine.lines} plus={u.plus} minus={u.minus} />
        </span>
        <span className="engine-field">
          <select aria-label={u.limitLabel} className="mode-select" value={limit} onChange={(e) => updateWindow({ limit: e.target.value as LimitMode })}>
            <option value="depth">{u.modeDepth}</option>
            <option value="time">{u.modeTime}</option>
            <option value="infinite">{u.modeInfinite} ∞</option>
          </select>
          {limit === "depth" && (
            <Stepper value={depth} min={1} max={99} onChange={(v) => updateWindow({ depth: v })} label={u.modeDepth} plus={u.plus} minus={u.minus} />
          )}
          {limit === "time" && (
            <>
              <Stepper value={seconds} min={1} max={MAX_SECONDS} step={(v, dir) => g.timeStep * dir} onChange={(v) => updateWindow({ seconds: v })} label={`${u.modeTime} (${u.unitSeconds})`} plus={u.plus} minus={u.minus} wide />
              <span className="unit" title={u.unitSeconds}>s</span>
              {timed && <span className="engine-clock" aria-hidden="true">{clock(g.timer === "down" ? seconds * 1000 - elapsedMs : elapsedMs)}</span>}
            </>
          )}
          {limit === "infinite" && <span className="infinity" aria-label={u.modeInfinite}>∞</span>}
        </span>
      </div>

      {on && status === "consent" && ask && (
        <SettingsDialog title={st.download.title} closeLabel={st.close} onClose={() => { setOn(false); setAsk(null); }}>
          <p className="wc-intro">{st.download.intro}</p>
          <p className="wc-intro"><strong>{engineName(runDef, manifest)}</strong> – {st.download.size}: <strong>{ask.sizeMB ? `${ask.sizeMB} MB` : st.download.sizeUnknown}</strong></p>
          <ul className="wc-points">
            {st.download.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <div className="wc-dialog-actions wc-two">
            <button type="button" className="wc-btn" onClick={() => { setOn(false); setAsk(null); }}>{st.download.cancel}</button>
            <button type="button" className="wc-btn wc-btn-primary" autoFocus onClick={() => { rememberAccepted(ask.file); setAsk(null); setOkTick((n) => n + 1); }}>{st.download.confirm}</button>
          </div>
        </SettingsDialog>
      )}
      {on && status === "loading" && <p className="panel-note">{t.engine.loading}</p>}
      {on && status === "missing" && <p className="panel-note">{t.engine.notInstalled}</p>}
      {on && status === "reload" && (
        <p className="panel-note">
          {st.engine.needsReload}{" "}
          <button type="button" className="small" onClick={() => window.location.reload()}>{st.engine.reload}</button>
        </p>
      )}
      {on && fellBack && status === "ready" && <p className="panel-note">{t.engine.fellBack}</p>}
      {on && status === "error" && <p className="panel-note">{t.engine.unavailable}</p>}
      {on && status === "ready" && live.length === 0 && !gameOver && <p className="panel-note">{t.engine.waiting}</p>}
      {on && status === "ready" && gameOver && <p className="panel-note">{t.engine.noLines}</p>}

      {showLines ? (
        live.map((l) => (
          <button
            type="button"
            key={l.multipv}
            className="engine-line"
            onClick={() => l.pv[0] && onPlay(l.pv[0].slice(0, 2), l.pv[0].slice(2, 4))}
          >
            <span className="score">{formatScoreUnit(l, scoreUnit)}</span>
            <span className="pv">{pvToMoves(fen, l.pv, moves).map((m) => `${m.number} ${figurine(m.san, room.figurines)}`.trim()).join(" ")}</span>
            <span>{t.engine.depth} {l.depth}</span>
          </button>
        ))
      ) : (
        live[0] && (
          <div className="engine-scoreonly">
            <span className="score">{formatScoreUnit(live[0], scoreUnit)}</span>
            <span>{t.engine.depth} {live[0].depth}</span>
          </div>
        )
      )}
      {id === 1 && <p className="panel-note">{t.engine.localNote}</p>}
    </section>
  );
}
