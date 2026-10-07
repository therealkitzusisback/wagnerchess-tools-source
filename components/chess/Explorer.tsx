"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FolderRow } from "@/lib/chess/folders";
import type { LayoutTexts } from "@/lib/chess/layout-texts";
import { filterTree } from "@/lib/chess/tree-filter";
import { Chevron, FileIcon, FolderIcon } from "./tree-icons";

export type FileRow = { id: string; title: string; folder_id: string | null };

// Folder tree of the signed-in account (left of the board). Click a file to open it.
export default function Explorer({
  folders, files, activeFileId, signedIn, x, onOpen, onNew, onExport, onImport, onSave, handle,
}: {
  handle?: React.ReactNode; // grip for moving the window (Pro/Admin)
  folders: FolderRow[];
  files: FileRow[];
  activeFileId: string | null;
  signedIn: boolean;
  x: LayoutTexts;
  onOpen: (id: string) => void;
  onNew: () => void;
  onExport: () => void;
  onImport: () => void;
  onSave: () => void;
}) {
  const byParent = useMemo(() => {
    const m = new Map<string | null, FolderRow[]>();
    for (const f of folders) m.set(f.parent_id, [...(m.get(f.parent_id) ?? []), f]);
    for (const list of m.values()) list.sort((a, b) => a.name.localeCompare(b.name, "de"));
    return m;
  }, [folders]);
  const filesIn = useMemo(() => {
    const m = new Map<string | null, FileRow[]>();
    for (const f of files) m.set(f.folder_id, [...(m.get(f.folder_id) ?? []), f]);
    for (const list of m.values()) list.sort((a, b) => a.title.localeCompare(b.title, "de"));
    return m;
  }, [files]);

  // Folders on the way to the open file start expanded.
  const initialOpen = useMemo(() => {
    const open = new Set<string>();
    const active = files.find((f) => f.id === activeFileId);
    let cur = active?.folder_id ?? null;
    const map = new Map(folders.map((f) => [f.id, f]));
    while (cur && !open.has(cur)) {
      open.add(cur);
      cur = map.get(cur)?.parent_id ?? null;
    }
    return open;
    // computed once on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [open, setOpen] = useState<Set<string>>(initialOpen);
  const [query, setQuery] = useState("");
  // With a search text only matching analyses and the folders that lead to them are shown (and opened).
  const visible = useMemo(() => filterTree(folders, files, query), [query, files, folders]);
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const fileButton = (f: FileRow, depth: number) => (
    <li key={f.id}>
      <button
        type="button"
        className={`tree-item file${f.id === activeFileId ? " active" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => onOpen(f.id)}
        title={f.title}
      >
        <span className="tree-icon" aria-hidden="true" />
        <span className="tree-icon" aria-hidden="true"><FileIcon /></span>
        <span className="tree-label">{f.title}</span>
      </button>
    </li>
  );

  const renderFolder = (parent: string | null, depth: number): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    for (const f of byParent.get(parent) ?? []) {
      if (visible && !visible.folderIds.has(f.id)) continue;
      const isOpen = visible ? true : open.has(f.id);
      out.push(
        <li key={`d-${f.id}`}>
          <button
            type="button"
            className="tree-item folder"
            style={{ paddingLeft: 8 + depth * 14 }}
            aria-expanded={isOpen}
            onClick={() => toggle(f.id)}
          >
            <span className="tree-icon" aria-hidden="true"><Chevron open={isOpen} /></span>
            <span className="tree-icon" aria-hidden="true"><FolderIcon open={isOpen} /></span>
            <span className="tree-label">{f.name}</span>
          </button>
          {isOpen && (
            <ul className="tree">
              {renderFolder(f.id, depth + 1)}
              {(filesIn.get(f.id) ?? []).filter((file) => !visible || visible.fileIds.has(file.id) || visible.matchedFolders.has(f.id)).map((file) => fileButton(file, depth + 1))}
            </ul>
          )}
        </li>
      );
    }
    return out;
  };

  return (
    <aside className="explorer panel-box" aria-label={x.explorer.title}>
      <div className="explorer-head">
        <div className="head-left">{handle}<h2>{x.explorer.title}</h2></div>
        {signedIn && (
          <div className="explorer-head-right">
            <Link href="/tools/library" className="explorer-manage">{x.explorer.manage}</Link>
            <button type="button" className="icon-btn" onClick={onNew} aria-label={x.explorer.newAnalysis} title={x.explorer.newAnalysis}>＋</button>
          </div>
        )}
      </div>
      {signedIn ? (
        <>
          <input
            type="search"
            className="explorer-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={x.explorer.search}
            aria-label={x.explorer.search}
          />
          <div className="explorer-scroll">
            {folders.length === 0 && files.length === 0 ? (
              <p className="panel-note">{x.explorer.empty}</p>
            ) : (
              <ul className="tree root">
                {renderFolder(null, 0)}
                {(filesIn.get(null) ?? []).filter((file) => !visible || visible.fileIds.has(file.id)).map((file) => fileButton(file, 0))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="explorer-scroll">
          <p className="panel-note">{x.explorer.guest}</p>
          <Link href="/login?next=/tools/analysisroom" className="btn btn-secondary">{x.explorer.login}</Link>
        </div>
      )}
      <div className="explorer-foot">
        <button type="button" onClick={onExport}>{x.tabs.export}</button>
        <button type="button" onClick={onImport}>{x.tabs.import}</button>
        <button type="button" onClick={onSave}>{x.tabs.save}</button>
      </div>
    </aside>
  );
}
