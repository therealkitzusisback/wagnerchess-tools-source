"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { DATABASES, type DatabaseId } from "@/lib/chess/databases";
import type { FolderRow } from "@/lib/chess/folders";
import type { LayoutTexts } from "@/lib/chess/layout-texts";
import type { RailTexts } from "@/lib/chess/rail-texts";
import { ENDGAMES, OPENINGS, fullFen, looksLikeFen, norm, openingPgn, searchEndgames, searchOpenings, type EndgameEntry, type OpeningEntry } from "@/lib/chess/search-data";
import Explorer, { type FileRow } from "./Explorer";

// Windows opened from the left rail of the Analysis Room (all of them are windows of this website, centred on the page).

export function FilesDialog({
  x, r, closeLabel, folders, files, activeFileId, signedIn, onOpen, onNew, onExport, onImport, onSave, onClose,
}: {
  x: LayoutTexts; r: RailTexts; closeLabel: string; folders: FolderRow[]; files: FileRow[]; activeFileId: string | null; signedIn: boolean;
  onOpen: (id: string) => void; onNew: () => void; onExport: () => void; onImport: () => void; onSave: () => void; onClose: () => void;
}) {
  return (
    <SettingsDialog title={r.filesDialog} closeLabel={closeLabel} onClose={onClose} wide>
      <div className="rail-files">
        <Explorer folders={folders} files={files} activeFileId={activeFileId} signedIn={signedIn} x={x} onOpen={onOpen} onNew={onNew} onExport={onExport} onImport={onImport} onSave={onSave} />
      </div>
    </SettingsDialog>
  );
}

export function DatabasesDialog({
  r, closeLabel, signedIn, isPro, onMine, onOpenings, onEndgames, onClose,
}: {
  r: RailTexts; closeLabel: string; signedIn: boolean; isPro: boolean; onMine: () => void; onOpenings: () => void; onEndgames: () => void; onClose: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const click = (id: DatabaseId, level: "free" | "pro", status: "ready" | "soon") => {
    if (!signedIn) return setNote(r.db.signIn);
    if (level === "pro" && !isPro) return setNote(r.db.lockedPro);
    if (status === "soon") return setNote(r.db.soon);
    setNote(null);
    if (id === "mine") onMine();
    if (id === "openings") onOpenings();
    if (id === "tablebase") onEndgames();
  };
  return (
    <SettingsDialog title={r.db.title} closeLabel={closeLabel} onClose={onClose}>
      <p className="wc-row-hint wc-intro">{r.db.intro}</p>
      <ul className="rail-db-list">
        {DATABASES.map((d) => {
          const locked = d.level === "pro" && !isPro;
          return (
            <li key={d.id}>
              <button type="button" className={`rail-db${locked ? " locked" : ""}`} onClick={() => click(d.id, d.level, d.status)}>
                <span className="rail-db-text">
                  <strong>{r.db.names[d.id]}</strong>
                  <span>{r.db.hints[d.id]}</span>
                </span>
                <span className="rail-db-tags">
                  {d.level === "pro" && <em className="rail-tag pro">{r.db.proTag}</em>}
                  {d.status === "soon" ? <em className="rail-tag">{r.db.soon}</em> : <em className="rail-tag ok">{r.db.open}</em>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {note && <p className="wc-msg" role="status">{note}</p>}
    </SettingsDialog>
  );
}

type Kind = "all" | "players" | "games" | "tournaments" | "openings" | "endgames" | "books";
const SOON_KINDS: Kind[] = ["players", "games", "tournaments", "books"];

export function SearchDialog({
  r, closeLabel, initialKind, onPgn, onFen, onClose,
}: {
  r: RailTexts; closeLabel: string; initialKind: Kind; onPgn: (pgn: string) => string | null; onFen: (fen: string) => string | null; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>(initialKind);
  const [msg, setMsg] = useState<string | null>(null);
  const isFen = looksLikeFen(q);
  const showAll = !norm(q);
  const openings: OpeningEntry[] = useMemo(() => (kind === "all" || kind === "openings" ? (showAll && kind === "openings" ? OPENINGS : searchOpenings(q)) : []), [q, kind, showAll]);
  const endgames: EndgameEntry[] = useMemo(() => (kind === "all" || kind === "endgames" ? (showAll && kind === "endgames" ? ENDGAMES : searchEndgames(q)) : []), [q, kind, showAll]);
  const load = (fn: () => string | null) => {
    const err = fn();
    if (err) setMsg(err);
    else onClose();
  };
  const empty = !isFen && openings.length === 0 && endgames.length === 0 && (!showAll || kind === "all");
  return (
    <SettingsDialog title={r.s.title} closeLabel={closeLabel} onClose={onClose} wide>
      <input className="wc-input" type="search" value={q} placeholder={r.s.placeholder} onChange={(e) => { setQ(e.target.value); setMsg(null); }} autoFocus spellCheck={false} aria-label={r.s.title} />
      <div className="rail-chips" role="tablist">
        {(Object.keys(r.s.chips) as Kind[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} className={`${kind === k ? "on" : ""}${SOON_KINDS.includes(k) ? " soon" : ""}`} onClick={() => { setKind(k); setMsg(null); }}>
            {r.s.chips[k]}
          </button>
        ))}
      </div>
      {isFen && (
        <div className="rail-results">
          <h4>{r.s.position}</h4>
          <button type="button" className="rail-result" onClick={() => load(() => onFen(fullFen(q)))}>
            <strong>{r.s.loadFen}</strong>
            <span>{fullFen(q)}</span>
          </button>
        </div>
      )}
      {openings.length > 0 && (
        <div className="rail-results">
          <h4>{r.s.openings}</h4>
          {openings.map((o) => (
            <button key={o.eco + o.name + o.moves} type="button" className="rail-result" onClick={() => load(() => onPgn(openingPgn(o)))}>
              <strong>{o.eco} · {o.name}</strong>
              <span>{o.moves}</span>
            </button>
          ))}
        </div>
      )}
      {endgames.length > 0 && (
        <div className="rail-results">
          <h4>{r.s.endgames}</h4>
          {endgames.map((e) => (
            <button key={e.name} type="button" className="rail-result" onClick={() => load(() => onFen(e.fen))}>
              <strong>{e.name}</strong>
              <span>{e.fen}</span>
            </button>
          ))}
        </div>
      )}
      {SOON_KINDS.includes(kind) && <p className="wc-row-hint rail-note">{r.s.chips[kind]}: {r.s.chipSoon}.</p>}
      {kind === "all" && showAll && <p className="wc-row-hint rail-note">{r.s.hint} {r.s.soonNote}</p>}
      {!showAll && empty && !SOON_KINDS.includes(kind) && <p className="wc-row-hint rail-note">{r.s.none}</p>}
      {msg && <p className="wc-msg" role="alert">{msg}</p>}
    </SettingsDialog>
  );
}

export type MoreItem = { label: string; run: () => void; group: "file" | "board" | "site"; href?: string };
export function MoreDialog({ r, closeLabel, items, onClose }: { r: RailTexts; closeLabel: string; items: MoreItem[]; onClose: () => void }) {
  const groups: Array<[MoreItem["group"], string]> = [["file", r.m.groupFile], ["board", r.m.groupBoard], ["site", r.m.groupSite]];
  return (
    <SettingsDialog title={r.m.title} closeLabel={closeLabel} onClose={onClose}>
      <p className="wc-row-hint wc-intro">{r.m.intro}</p>
      {groups.map(([g, title]) => (
        <div key={g} className="rail-group">
          <h4 className="wc-subhead">{title}</h4>
          <div className="rail-more">
            {items.filter((i) => i.group === g).map((i) =>
              i.href ? (
                <Link key={i.label} href={i.href} className="wc-btn" onClick={onClose}>{i.label}</Link>
              ) : (
                <button key={i.label} type="button" className="wc-btn" onClick={() => { onClose(); i.run(); }}>{i.label}</button>
              )
            )}
          </div>
        </div>
      ))}
    </SettingsDialog>
  );
}
