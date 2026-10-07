"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createFolderAction, deleteFileAction, deleteFolderAction, moveFileAction, moveFolderAction, renameFileAction, renameFolderAction,
  loadPgnsAction, type LibResult,
} from "@/app/tools/library-actions";
import type { FolderRow } from "@/lib/chess/folders";
import type { LibraryUiTexts } from "@/lib/chess/library-ui-texts";
import type { LibraryTexts } from "@/lib/chess/texts";
import { buildZip, safeName } from "@/lib/zip";
import { filterTree } from "@/lib/chess/tree-filter";
import { Chevron, FileIcon, FolderIcon } from "./tree-icons";

export type LibFile = { id: string; title: string; folder_id: string | null; updated_at: string };
type Target = { kind: "file"; id: string } | { kind: "folder"; id: string } | { kind: "root" };
type Dialog =
  | { kind: "rename"; target: Target & { kind: "file" | "folder" }; value: string }
  | { kind: "newfolder"; parent: string | null; value: string }
  | { kind: "delete"; target: Target & { kind: "file" | "folder" } }
  | { kind: "move"; target: Target & { kind: "file" | "folder" } }
  | { kind: "export"; target: Target & { kind: "folder" | "root" } };

// File manager like the Windows Explorer: several folders open at once, drag and drop, right-click menu.
export default function LibraryManager({
  initialFolders, initialFiles, t, u, lang,
}: {
  initialFolders: FolderRow[];
  initialFiles: LibFile[];
  t: LibraryTexts;
  u: LibraryUiTexts;
  lang: "de" | "en";
}) {
  const router = useRouter();
  const [folders, setFolders] = useState(initialFolders);
  const [files, setFiles] = useState(initialFiles);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ x: number; y: number; target: Target } | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const dragRef = useRef<{ kind: "file" | "folder"; id: string } | null>(null);

  const byParent = useMemo(() => {
    const m = new Map<string | null, FolderRow[]>();
    for (const f of folders) m.set(f.parent_id, [...(m.get(f.parent_id) ?? []), f]);
    for (const list of m.values()) list.sort((a, b) => a.name.localeCompare(b.name, lang));
    return m;
  }, [folders, lang]);
  const filesIn = useMemo(() => {
    const m = new Map<string | null, LibFile[]>();
    for (const f of files) m.set(f.folder_id, [...(m.get(f.folder_id) ?? []), f]);
    for (const list of m.values()) list.sort((a, b) => a.title.localeCompare(b.title, lang));
    return m;
  }, [files, lang]);

  const visible = useMemo(() => filterTree(folders, files, query), [folders, files, query]);

  const descendants = (id: string): Set<string> => {
    const set = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const f of folders) {
        if (f.parent_id && set.has(f.parent_id) && !set.has(f.id)) {
          set.add(f.id);
          grew = true;
        }
      }
    }
    return set;
  };

  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : "en-GB");
  const fail = (error: string) => setNotice({ kind: "err", text: t.errors[error] ?? t.errors.generic });
  const succeed = (text: string) => setNotice({ kind: "ok", text });

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
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
  }, [menu]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  /* ------------------------------------------------------------ actions */
  const run = async (action: () => Promise<LibResult>, onOk: (r: Extract<LibResult, { ok: true }>) => void) => {
    setBusy(true);
    try {
      const r = await action();
      if (r.ok) onOk(r);
      else fail(r.error);
    } catch {
      fail("generic");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const moveItem = (item: { kind: "file" | "folder"; id: string }, target: string | null) => {
    if (item.kind === "file") {
      const file = files.find((f) => f.id === item.id);
      if (!file || file.folder_id === target) return;
      run(() => moveFileAction(item.id, target), () => {
        setFiles((cur) => cur.map((f) => (f.id === item.id ? { ...f, folder_id: target } : f)));
        if (target) setOpen((s) => new Set(s).add(target));
        succeed(u.moved);
      });
    } else {
      const folder = folders.find((f) => f.id === item.id);
      if (!folder || folder.parent_id === target) return;
      if (target && descendants(item.id).has(target)) return fail("invalid");
      run(() => moveFolderAction(item.id, target), () => {
        setFolders((cur) => cur.map((f) => (f.id === item.id ? { ...f, parent_id: target } : f)));
        if (target) setOpen((s) => new Set(s).add(target));
        succeed(u.moved);
      });
    }
  };

  const submitDialog = () => {
    if (!dialog) return;
    if (dialog.kind === "newfolder") {
      const name = dialog.value;
      run(() => createFolderAction(name, dialog.parent), (r) => {
        setFolders((cur) => [...cur, { id: r.id as string, name: name.trim().replace(/\s+/g, " "), parent_id: dialog.parent }]);
        if (dialog.parent) setOpen((s) => new Set(s).add(dialog.parent as string));
        succeed(u.created);
        setDialog(null);
      });
    } else if (dialog.kind === "rename") {
      const { target, value } = dialog;
      const clean = value.trim().replace(/\s+/g, " ");
      run(
        () => (target.kind === "file" ? renameFileAction(target.id, value) : renameFolderAction(target.id, value)),
        () => {
          if (target.kind === "file") setFiles((cur) => cur.map((f) => (f.id === target.id ? { ...f, title: clean } : f)));
          else setFolders((cur) => cur.map((f) => (f.id === target.id ? { ...f, name: clean } : f)));
          succeed(u.renamed);
          setDialog(null);
        }
      );
    } else if (dialog.kind === "delete") {
      const { target } = dialog;
      run(
        () => (target.kind === "file" ? deleteFileAction(target.id) : deleteFolderAction(target.id)),
        () => {
          if (target.kind === "file") setFiles((cur) => cur.filter((f) => f.id !== target.id));
          else {
            const gone = descendants(target.id);
            setFolders((cur) => cur.filter((f) => !gone.has(f.id)));
            setFiles((cur) => cur.filter((f) => !f.folder_id || !gone.has(f.folder_id)));
          }
          succeed(u.deleted);
          setDialog(null);
        }
      );
    }
  };

  /* ------------------------------------------------------------ export (download) */
  // Folder path of a folder, e.g. "My Repertoire/Black", relative to the exported folder (rootId = null: whole library).
  const exportPlan = (rootId: string | null) => {
    const ids = rootId ? descendants(rootId) : new Set(folders.map((f) => f.id));
    const pathOf = (id: string | null): string => {
      const parts: string[] = [];
      let cur = id ? folders.find((f) => f.id === id) : undefined;
      let guard = 0;
      while (cur && guard++ < 20) {
        parts.unshift(safeName(cur.name));
        if (cur.id === rootId) break;
        cur = cur.parent_id ? folders.find((f) => f.id === cur!.parent_id) : undefined;
      }
      return parts.join("/");
    };
    const list = files.filter((f) => (rootId ? f.folder_id !== null && ids.has(f.folder_id) : true));
    return { folderPaths: folders.filter((f) => ids.has(f.id)).map((f) => pathOf(f.id)), files: list, pathOf };
  };
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const exportNow = async (rootId: string | null, format: "zip" | "pgn") => {
    const plan = exportPlan(rootId);
    setBusy(true);
    try {
      const res = await loadPgnsAction(plan.files.map((f) => f.id));
      if (!res.ok) return fail("generic");
      const pgnById = new Map(res.items.map((i) => [i.id, i.pgn]));
      const base = rootId ? safeName(folders.find((f) => f.id === rootId)?.name ?? "analyses") : "analyses";
      if (format === "pgn") {
        const text = plan.files.map((f) => (pgnById.get(f.id) ?? "").trim()).filter(Boolean).join("\n\n") + "\n";
        download(new Blob([text], { type: "application/x-chess-pgn" }), `${base}.pgn`);
      } else {
        const used = new Set<string>();
        const entries = plan.folderPaths.map((p) => ({ name: `${p}/`, data: "" }));
        for (const f of plan.files) {
          const dir = f.folder_id ? plan.pathOf(f.folder_id) : "";
          let name = `${dir ? `${dir}/` : ""}${safeName(f.title)}`;
          let n = 2;
          while (used.has(name.toLowerCase())) name = `${dir ? `${dir}/` : ""}${safeName(f.title)} (${n++})`;
          used.add(name.toLowerCase());
          entries.push({ name: `${name}.pgn`, data: pgnById.get(f.id) ?? "" });
        }
        download(buildZip(entries), `${base}.zip`);
      }
      succeed(u.exportDone);
      setDialog(null);
    } catch {
      fail("generic");
    } finally {
      setBusy(false);
    }
  };
  const exportFile = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;
    const res = await loadPgnsAction([id]).catch(() => null);
    if (!res || !res.ok || !res.items[0]) return fail("generic");
    download(new Blob([res.items[0].pgn.trim() + "\n"], { type: "application/x-chess-pgn" }), `${safeName(file.title)}.pgn`);
    succeed(u.exportDone);
  };

  /* ------------------------------------------------------------ menu */
  const openMenu = (e: React.MouseEvent, target: Target) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: Math.min(e.clientX, window.innerWidth - 230), y: Math.min(e.clientY, window.innerHeight - 220), target });
  };
  const openMenuFromButton = (e: React.MouseEvent<HTMLButtonElement>, target: Target) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ x: Math.min(r.left, window.innerWidth - 230), y: Math.min(r.bottom + 4, window.innerHeight - 220), target });
  };

  const nameOf = (target: Target) =>
    target.kind === "file" ? files.find((f) => f.id === target.id)?.title ?? "" : target.kind === "folder" ? folders.find((f) => f.id === target.id)?.name ?? "" : "";

  const menuItems = (target: Target): { label: string; run: () => void; danger?: boolean }[] => {
    if (target.kind === "root") {
      return [
        { label: u.newFolder, run: () => setDialog({ kind: "newfolder", parent: null, value: "" }) },
        { label: u.exportAll, run: () => setDialog({ kind: "export", target }) },
      ];
    }
    if (target.kind === "file") {
      return [
        { label: u.open, run: () => router.push(`/tools/analysisroom?file=${target.id}`) },
        { label: u.rename, run: () => setDialog({ kind: "rename", target, value: nameOf(target) }) },
        { label: u.exportAction, run: () => exportFile(target.id) },
        { label: u.moveTo, run: () => setDialog({ kind: "move", target }) },
        { label: u.delete, danger: true, run: () => setDialog({ kind: "delete", target }) },
      ];
    }
    return [
      { label: u.newSubfolder, run: () => setDialog({ kind: "newfolder", parent: target.id, value: "" }) },
      { label: u.exportAction, run: () => setDialog({ kind: "export", target }) },
      { label: u.rename, run: () => setDialog({ kind: "rename", target, value: nameOf(target) }) },
      { label: u.moveTo, run: () => setDialog({ kind: "move", target }) },
      { label: u.delete, danger: true, run: () => setDialog({ kind: "delete", target }) },
    ];
  };

  /* ------------------------------------------------------------ drag and drop */
  const canDropOn = (folderId: string | null) => {
    const d = dragRef.current;
    if (!d) return false;
    if (d.kind === "folder" && folderId && descendants(d.id).has(folderId)) return false;
    return true;
  };
  const dropProps = (folderId: string | null, key: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!canDropOn(folderId)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOver !== key) setDragOver(key);
    },
    onDragLeave: () => setDragOver((cur) => (cur === key ? null : cur)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(null);
      const d = dragRef.current;
      dragRef.current = null;
      if (d && canDropOn(folderId)) moveItem(d, folderId);
    },
  });
  const dragProps = (item: { kind: "file" | "folder"; id: string }) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragRef.current = item;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.id);
    },
    onDragEnd: () => {
      dragRef.current = null;
      setDragOver(null);
    },
  });

  /* ------------------------------------------------------------ rendering */
  const fileRow = (f: LibFile, depth: number) => (
    <li key={f.id}>
      <div className="lm-row file" style={{ paddingLeft: 8 + depth * 18 }} onContextMenu={(e) => openMenu(e, { kind: "file", id: f.id })} {...dragProps({ kind: "file", id: f.id })}>
        <span className="lm-toggle spacer" aria-hidden="true" />
        <span className="lm-icon" aria-hidden="true"><FileIcon /></span>
        <Link href={`/tools/analysisroom?file=${f.id}`} className="lm-name">{f.title}</Link>
        <span className="lm-date">{u.changed}: {date(f.updated_at)}</span>
        <button type="button" className="lm-more" aria-label={u.more} title={u.more} onClick={(e) => openMenuFromButton(e, { kind: "file", id: f.id })}>⋯</button>
      </div>
    </li>
  );

  const renderLevel = (parent: string | null, depth: number): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    for (const f of byParent.get(parent) ?? []) {
      if (visible && !visible.folderIds.has(f.id)) continue;
      const isOpen = visible ? true : open.has(f.id);
      const count = (byParent.get(f.id)?.length ?? 0) + (filesIn.get(f.id)?.length ?? 0);
      out.push(
        <li key={`d-${f.id}`}>
          <div
            className={`lm-row folder${dragOver === f.id ? " drop" : ""}`}
            style={{ paddingLeft: 8 + depth * 18 }}
            onContextMenu={(e) => openMenu(e, { kind: "folder", id: f.id })}
            {...dragProps({ kind: "folder", id: f.id })}
            {...dropProps(f.id, f.id)}
          >
            <button type="button" className="lm-toggle" aria-expanded={isOpen} aria-label={f.name} onClick={() => toggle(f.id)}><Chevron open={isOpen} /></button>
            <span className="lm-icon" aria-hidden="true"><FolderIcon open={isOpen} /></span>
            <button type="button" className="lm-name" onClick={() => toggle(f.id)}>{f.name}</button>
            <span className="lm-date">{count} {u.items}</span>
            <button type="button" className="lm-more" aria-label={u.more} title={u.more} onClick={(e) => openMenuFromButton(e, { kind: "folder", id: f.id })}>⋯</button>
          </div>
          {isOpen && (
            <ul className="lm-list">
              {renderLevel(f.id, depth + 1)}
              {(filesIn.get(f.id) ?? []).filter((file) => !visible || visible.fileIds.has(file.id) || visible.matchedFolders.has(f.id)).map((file) => fileRow(file, depth + 1))}
            </ul>
          )}
        </li>
      );
    }
    return out;
  };

  // Destinations offered in the "Move to" dialog.
  const moveOptions = (target: Target & { kind: "file" | "folder" }) => {
    const banned = target.kind === "folder" ? descendants(target.id) : new Set<string>();
    const current = target.kind === "file" ? files.find((f) => f.id === target.id)?.folder_id ?? null : folders.find((f) => f.id === target.id)?.parent_id ?? null;
    const out: { id: string | null; label: string; depth: number; disabled: boolean }[] = [
      { id: null, label: u.mainFolder, depth: 0, disabled: current === null },
    ];
    const visit = (parent: string | null, depth: number) => {
      for (const f of byParent.get(parent) ?? []) {
        if (banned.has(f.id)) continue;
        out.push({ id: f.id, label: f.name, depth: depth + 1, disabled: current === f.id });
        if (depth < 8) visit(f.id, depth + 1);
      }
    };
    visit(null, 0);
    return out;
  };

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="lm">
      <div className="lm-toolbar">
        <Link href="/tools/analysisroom" className="btn btn-primary">＋ {u.newAnalysis}</Link>
        <button type="button" className="btn btn-secondary" onClick={() => setDialog({ kind: "newfolder", parent: null, value: "" })}>＋ {u.newFolder}</button>
        <button type="button" className="btn btn-secondary" onClick={() => setDialog({ kind: "export", target: { kind: "root" } })}>{u.exportAll}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(new Set(folders.map((f) => f.id)))}>{u.expandAll}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(new Set())}>{u.collapseAll}</button>
      </div>

      <p className="lm-hint">{u.hint}</p>
      {notice && <p className={`form-message ${notice.kind === "ok" ? "form-success" : "form-error"}`} role={notice.kind === "ok" ? "status" : "alert"}>{notice.text}</p>}

      <div
        className="lm-tree"
        aria-busy={busy}
        onContextMenu={(e) => openMenu(e, { kind: "root" })}
        {...dropProps(null, "root")}
      >
        <input
          type="search"
          className="lm-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={u.search}
          aria-label={u.search}
        />
        <div className={`lm-row root${dragOver === "root" ? " drop" : ""}`}>
          <span className="lm-name static">{u.mainFolder}</span>
        </div>
        {isEmpty ? (
          <p className="lm-empty">{u.empty}</p>
        ) : (
          <ul className="lm-list">
            {renderLevel(null, 0)}
            {(filesIn.get(null) ?? []).filter((f) => !visible || visible.fileIds.has(f.id)).map((f) => fileRow(f, 0))}
          </ul>
        )}
      </div>

      {menu && (
        <div className="lm-menu" role="menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {menuItems(menu.target).map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={item.danger ? "danger" : ""}
              onClick={() => {
                setMenu(null);
                item.run();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {dialog && (
        <div className="lm-overlay" role="dialog" aria-modal="true" onClick={() => setDialog(null)}>
          <div className="lm-dialog" onClick={(e) => e.stopPropagation()}>
            {(dialog.kind === "rename" || dialog.kind === "newfolder") && (
              <>
                <h2>{dialog.kind === "rename" ? u.renameTitle : u.newFolderTitle}</h2>
                <label>
                  {u.nameLabel}
                  <input
                    autoFocus
                    value={dialog.value}
                    maxLength={dialog.kind === "rename" && dialog.target.kind === "file" ? 120 : 80}
                    onChange={(e) => setDialog({ ...dialog, value: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && submitDialog()}
                  />
                </label>
                <div className="lm-dialog-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>{u.cancel}</button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={submitDialog}>{u.ok}</button>
                </div>
              </>
            )}
            {dialog.kind === "delete" && (
              <>
                <h2>{u.delete}</h2>
                <p>{dialog.target.kind === "file" ? u.deleteFile.replace("{name}", nameOf(dialog.target)) : u.deleteFolder.replace("{name}", nameOf(dialog.target))}</p>
                <p className="lm-hint">{u.deleteHint}</p>
                <div className="lm-dialog-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>{u.cancel}</button>
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={submitDialog}>{u.delete}</button>
                </div>
              </>
            )}
            {dialog.kind === "export" && (() => {
              const rootId = dialog.target.kind === "folder" ? dialog.target.id : null;
              const plan = exportPlan(rootId);
              const name = rootId ? nameOf(dialog.target) : u.mainFolder;
              return (
                <>
                  <h2>{u.exportTitle}</h2>
                  {plan.files.length === 0 ? (
                    <p>{u.exportNothing}</p>
                  ) : (
                    <>
                      <p className="lm-hint">{u.exportScope.replace("{n}", String(plan.files.length)).replace("{name}", name)}</p>
                      <div className="lm-export-choices">
                        <button type="button" disabled={busy} onClick={() => exportNow(rootId, "zip")}>
                          <strong>{u.exportZip}</strong>
                          <span>{u.exportZipHint}</span>
                        </button>
                        <button type="button" disabled={busy} onClick={() => exportNow(rootId, "pgn")}>
                          <strong>{u.exportPgn}</strong>
                          <span>{u.exportPgnHint}</span>
                        </button>
                      </div>
                    </>
                  )}
                  <div className="lm-dialog-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>{u.cancel}</button>
                  </div>
                </>
              );
            })()}
            {dialog.kind === "move" && (
              <>
                <h2>{u.moveTitle}</h2>
                <ul className="lm-moves">
                  {moveOptions(dialog.target).map((o) => (
                    <li key={o.id ?? "root"}>
                      <button
                        type="button"
                        disabled={o.disabled || busy}
                        style={{ paddingLeft: 12 + o.depth * 18 }}
                        onClick={() => {
                          const d = dialog;
                          setDialog(null);
                          moveItem(d.target, o.id);
                        }}
                      >
                        {o.id ? "📁" : "🗂"} {o.label} {o.disabled ? u.currentPlace : ""}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="lm-dialog-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>{u.cancel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
