"use server";

import { revalidatePath } from "next/cache";
import { folderDepth, type FolderRow } from "@/lib/chess/folders";
import { createAuthClient } from "@/lib/supabase/auth-server";

// Actions of the file manager (/tools/library). They answer with a result instead of reloading the page,
// so the manager can update itself immediately. Every action checks for itself that the caller is signed in
// and only ever touches the caller's own rows.
export type LibResult = { ok: true; id?: string } | { ok: false; error: string };

const MAX_FOLDERS = 200;
const MAX_DEPTH = 6;

async function ctx() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, userId: user.id } : null;
}

async function loadFolders(supabase: NonNullable<Awaited<ReturnType<typeof ctx>>>["supabase"], userId: string) {
  const { data } = await supabase.from("analysis_folders").select("id, name, parent_id").eq("user_id", userId);
  return (data ?? []) as FolderRow[];
}

const clean = (v: unknown, max: number): string | null => {
  const s = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  return s.length >= 1 && s.length <= max ? s : null;
};
const uuid = (v: unknown): string | null => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

function refresh() {
  revalidatePath("/tools/library");
  revalidatePath("/tools/analysisroom");
}

export async function createFolderAction(nameIn: string, parentIn: string | null): Promise<LibResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "invalid" };
  const name = clean(nameIn, 80);
  if (!name) return { ok: false, error: "name" };
  const parent = parentIn ? uuid(parentIn) : null;
  if (parentIn && !parent) return { ok: false, error: "invalid" };

  const folders = await loadFolders(c.supabase, c.userId);
  if (folders.length >= MAX_FOLDERS) return { ok: false, error: "limit" };
  if (parent && !folders.some((f) => f.id === parent)) return { ok: false, error: "invalid" };
  if (folderDepth(folders, parent) + 1 > MAX_DEPTH) return { ok: false, error: "depth" };

  const { data, error } = await c.supabase
    .from("analysis_folders")
    .insert({ user_id: c.userId, parent_id: parent, name })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "generic" };
  refresh();
  return { ok: true, id: data.id as string };
}

export async function renameFolderAction(idIn: string, nameIn: string): Promise<LibResult> {
  const c = await ctx();
  const id = uuid(idIn);
  const name = clean(nameIn, 80);
  if (!c || !id) return { ok: false, error: "invalid" };
  if (!name) return { ok: false, error: "name" };
  const { error } = await c.supabase.from("analysis_folders").update({ name }).eq("id", id).eq("user_id", c.userId);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function moveFolderAction(idIn: string, targetIn: string | null): Promise<LibResult> {
  const c = await ctx();
  const id = uuid(idIn);
  const target = targetIn ? uuid(targetIn) : null;
  if (!c || !id || (targetIn && !target)) return { ok: false, error: "invalid" };

  const folders = await loadFolders(c.supabase, c.userId);
  if (!folders.some((f) => f.id === id)) return { ok: false, error: "invalid" };
  if (target && !folders.some((f) => f.id === target)) return { ok: false, error: "invalid" };

  // A folder must never be moved into itself or into one of its own subfolders.
  const subtree = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parent_id && subtree.has(f.parent_id) && !subtree.has(f.id)) {
        subtree.add(f.id);
        grew = true;
      }
    }
  }
  if (target && subtree.has(target)) return { ok: false, error: "invalid" };

  const height = (fid: string): number => 1 + Math.max(0, ...folders.filter((f) => f.parent_id === fid).map((f) => height(f.id)));
  if (folderDepth(folders, target) + height(id) > MAX_DEPTH) return { ok: false, error: "depth" };

  const { error } = await c.supabase.from("analysis_folders").update({ parent_id: target }).eq("id", id).eq("user_id", c.userId);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function deleteFolderAction(idIn: string): Promise<LibResult> {
  const c = await ctx();
  const id = uuid(idIn);
  if (!c || !id) return { ok: false, error: "invalid" };
  const { error } = await c.supabase.from("analysis_folders").delete().eq("id", id).eq("user_id", c.userId);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function renameFileAction(idIn: string, titleIn: string): Promise<LibResult> {
  const c = await ctx();
  const id = uuid(idIn);
  const title = clean(titleIn, 120);
  if (!c || !id) return { ok: false, error: "invalid" };
  if (!title) return { ok: false, error: "title" };
  const { error } = await c.supabase.from("analysis_files").update({ title }).eq("id", id).eq("user_id", c.userId);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function moveFileAction(idIn: string, targetIn: string | null): Promise<LibResult> {
  const c = await ctx();
  const id = uuid(idIn);
  const target = targetIn ? uuid(targetIn) : null;
  if (!c || !id || (targetIn && !target)) return { ok: false, error: "invalid" };
  if (target) {
    const folders = await loadFolders(c.supabase, c.userId);
    if (!folders.some((f) => f.id === target)) return { ok: false, error: "invalid" };
  }
  const { error } = await c.supabase.from("analysis_files").update({ folder_id: target }).eq("id", id).eq("user_id", c.userId);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

export async function deleteFileAction(idIn: string): Promise<LibResult> {
  const c = await ctx();
  const id = uuid(idIn);
  if (!c || !id) return { ok: false, error: "invalid" };
  const { error } = await c.supabase.from("analysis_files").delete().eq("id", id).eq("user_id", c.userId);
  if (error) return { ok: false, error: "generic" };
  refresh();
  return { ok: true };
}

// Download: the PGN texts of several analyses (only the caller's own, at most 1000 at a time).
export type PgnResult = { ok: true; items: { id: string; pgn: string }[] } | { ok: false; error: string };
export async function loadPgnsAction(idsIn: string[]): Promise<PgnResult> {
  const c = await ctx();
  if (!c) return { ok: false, error: "invalid" };
  const ids = (Array.isArray(idsIn) ? idsIn : []).map(uuid).filter((v): v is string => Boolean(v)).slice(0, 1000);
  if (ids.length === 0) return { ok: true, items: [] };
  const { data, error } = await c.supabase.from("analysis_files").select("id, pgn").eq("user_id", c.userId).in("id", ids);
  if (error) return { ok: false, error: "generic" };
  return { ok: true, items: (data ?? []).map((r) => ({ id: r.id as string, pgn: (r.pgn as string) ?? "" })) };
}
