"use client";

import Link from "next/link";
import { useState } from "react";
import SettingsDialog from "@/components/settings/SettingsDialog";
import type { FolderOption } from "@/lib/chess/folders";
import type { LayoutTexts } from "@/lib/chess/layout-texts";
import type { ChessTexts } from "@/lib/chess/texts";

// Small windows in the middle of the screen for Import, Export and Save (opened from the bottom row of "My Analyses").

export function ImportDialog({
  t, x, closeLabel, cancelLabel, onImport, onClose,
}: {
  t: ChessTexts; x: LayoutTexts; closeLabel: string; cancelLabel: string; onImport: (text: string) => string | null; onClose: () => void;
}) {
  const [mode, setMode] = useState<"pgn" | "fen">("pgn");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const it = x.importTabs;
  return (
    <SettingsDialog title={x.tabs.import} closeLabel={closeLabel} onClose={onClose}>
      <div className="view-switch wc-import-tabs" role="tablist">
        {(["pgn", "fen"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => { setMode(m); setMsg(null); }}>
            {it[m]}
          </button>
        ))}
      </div>
      <label htmlFor="import-text" className="wc-row-hint wc-intro">{mode === "pgn" ? it.pgnHint : it.fenHint}</label>
      {mode === "pgn" ? (
        <textarea id="import-text" className="wc-textarea" rows={9} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      ) : (
        <input id="import-text" className="wc-input" type="text" value={text} placeholder={it.fenPlaceholder} onChange={(e) => setText(e.target.value)} autoFocus spellCheck={false} />
      )}
      {msg && <p className="wc-msg" role="alert">{msg}</p>}
      <div className="wc-dialog-actions wc-two">
        <button type="button" className="wc-btn" onClick={onClose}>{cancelLabel}</button>
        <button
          type="button"
          className="wc-btn wc-btn-primary"
          onClick={() => {
            const error = onImport(mode === "fen" ? text.trim() : text);
            if (error) setMsg(error);
            else onClose();
          }}
        >
          {t.tools.importButton}
        </button>
      </div>
    </SettingsDialog>
  );
}

export function ExportDialog({
  t, x, closeLabel, onCopyPgn, onDownload, onCopyFen, onCopyMoves, onClose,
}: {
  t: ChessTexts; x: LayoutTexts; closeLabel: string;
  onCopyPgn: () => Promise<boolean>; onDownload: () => void; onCopyFen: () => Promise<boolean>; onCopyMoves: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const copy = async (fn: () => Promise<boolean>) => setMsg((await fn()) ? t.tools.copied : null);
  return (
    <SettingsDialog title={x.tabs.export} closeLabel={closeLabel} onClose={onClose}>
      <div className="wc-export-grid">
        <button type="button" className="wc-btn" onClick={() => copy(onCopyPgn)}>{x.export.copyPgn}</button>
        <button type="button" className="wc-btn" onClick={onDownload}>{x.export.downloadPgn}</button>
        <button type="button" className="wc-btn" onClick={() => copy(onCopyFen)}>{x.export.copyFen}</button>
        <button type="button" className="wc-btn" onClick={() => copy(onCopyMoves)}>{x.export.copyMoves}</button>
      </div>
      <p className="wc-msg" role="status">{msg ?? " "}</p>
    </SettingsDialog>
  );
}

export function SaveDialog({
  t, x, closeLabel, signedIn, folders, title, setTitle, folderId, setFolderId, hasFile, saving, onSave, onClose,
}: {
  t: ChessTexts; x: LayoutTexts; closeLabel: string; signedIn: boolean; folders: FolderOption[];
  title: string; setTitle: (v: string) => void; folderId: string; setFolderId: (v: string) => void;
  hasFile: boolean; saving: boolean; onSave: (asCopy: boolean) => Promise<string>; onClose: () => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <SettingsDialog title={x.tabs.save} closeLabel={closeLabel} onClose={onClose}>
      {signedIn ? (
        <>
          <div className="wc-form">
            <label htmlFor="save-title">
              {t.save.titleLabel}
              <input id="save-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </label>
            <label htmlFor="save-folder">
              {t.save.folderLabel}
              <select id="save-folder" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
                <option value="">{t.save.root}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="wc-msg" role="status">{msg ?? " "}</p>
          <div className="wc-dialog-actions wc-two">
            <Link href="/tools/library" className="wc-link">{t.save.library}</Link>
            {hasFile && (
              <button type="button" className="wc-btn" disabled={saving} onClick={async () => setMsg(await onSave(true))}>{t.save.saveCopy}</button>
            )}
            <button type="button" className="wc-btn wc-btn-primary" disabled={saving} onClick={async () => setMsg(await onSave(false))}>
              {hasFile ? t.save.update : t.save.save}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="wc-intro">{t.save.guest}</p>
          <div className="wc-dialog-actions">
            <Link href="/login?next=/tools/analysisroom" className="wc-btn wc-btn-primary">{t.save.login}</Link>
          </div>
        </>
      )}
    </SettingsDialog>
  );
}
