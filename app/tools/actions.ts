"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SaveInput, SaveResult } from "@/components/chess/AnalysisBoard";
import { folderDepth, type FolderRow } from "@/lib/chess/folders";
import { parsePgn } from "@/lib/chess/pgn";
import { createAuthClient } from "@/lib/supabase/auth-server";

const MAX_FOLDERS = 200;
const MAX_FILES = 500;
const MAX_DEPTH = 6;
const MAX_PGN = 200000;

async function context() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tools/library");
  return { supabase, userId: user.id };
}

async function loadFolders(supabase: Awaited<ReturnType<typeof createAuthClient>>, userId: string) {
  const { data } = await supabase.from("analysis_folders").select("id, name, parent_id").eq("user_id", userId);
  return (data ?? []) as FolderRow[];
}

function cleanName(value: FormDataEntryValue | null, max: number): string | null {
  const s = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return s.length >= 1 && s.length <= max ? s : null;
}

function idOrNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value : "";
  return /^[0-9a-f-]{36}$/i.test(s) ? s : null;
}

function back(folder: string | null, key: "ok" | "err", code: string): never {
  const q = new URLSearchParams();
  if (folder) q.set("folder", folder);
  q.set(key, code);
  revalidatePath("/tools/library");
  redirect(`/tools/library?${q.toString()}`);
}

/* ------------------------------------------------------------ save from the analysis board */
export async function saveAnalysis(input: SaveInput): Promise<SaveResult> {
  const { supabase, userId } = await context();

  const title = (input.title ?? "").trim();
  if (title.length < 1 || title.length > 120) return { ok: false, error: "title" };
  if (typeof input.pgn !== "string" || input.pgn.length > MAX_PGN) return { ok: false, error: "pgn" };
  try {
    parsePgn(input.pgn);
  } catch {
    return { ok: false, error: "pgn" };
  }

  let folderId: string | null = null;
  if (input.folderId) {
    folderId = idOrNull(input.folderId);
    const folders = await loadFolders(supabase, userId);
    if (!folderId || !folders.some((f) => f.id === folderId)) return { ok: false, error: "folder" };
  }

  if (input.id) {
    const id = idOrNull(input.id);
    if (!id) return { ok: false, error: "id" };
    const { error } = await supabase
      .from("analysis_files")
      .update({ title, pgn: input.pgn, folder_id: folderId, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: "save" };
    revalidatePath("/tools/library");
    return { ok: true, id };
  }

  const { count } = await supabase
    .from("analysis_files")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) >= MAX_FILES) return { ok: false, error: "limit" };

  const { data, error } = await supabase
    .from("analysis_files")
    .insert({ user_id: userId, title, pgn: input.pgn, folder_id: folderId })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "save" };
  revalidatePath("/tools/library");
  return { ok: true, id: data.id as string };
}

/* ------------------------------------------------------------ library: folders */
export async function createFolder(formData: FormData) {
  const { supabase, userId } = await context();
  const parent = idOrNull(formData.get("parent"));
  const name = cleanName(formData.get("name"), 80);
  if (!name) back(parent, "err", "name");

  const folders = await loadFolders(supabase, userId);
  if (folders.length >= MAX_FOLDERS) back(parent, "err", "limit");
  if (parent && !folders.some((f) => f.id === parent)) back(null, "err", "invalid");
  if (folderDepth(folders, parent) + 1 > MAX_DEPTH) back(parent, "err", "depth");

  const { error } = await supabase.from("analysis_folders").insert({ user_id: userId, parent_id: parent, name });
  if (error) back(parent, "err", "generic");
  back(parent, "ok", "folder");
}

export async function renameFolder(formData: FormData) {
  const { supabase, userId } = await context();
  const id = idOrNull(formData.get("id"));
  const name = cleanName(formData.get("name"), 80);
  const here = idOrNull(formData.get("here"));
  if (!id) back(here, "err", "invalid");
  if (!name) back(here, "err", "name");
  const { error } = await supabase.from("analysis_folders").update({ name }).eq("id", id).eq("user_id", userId);
  if (error) back(here, "err", "generic");
  back(here, "ok", "renamed");
}

export async function moveFolder(formData: FormData) {
  const { supabase, userId } = await context();
  const id = idOrNull(formData.get("id"));
  const target = idOrNull(formData.get("target"));
  const here = idOrNull(formData.get("here"));
  if (!id) back(here, "err", "invalid");

  const folders = await loadFolders(supabase, userId);
  if (!folders.some((f) => f.id === id)) back(here, "err", "invalid");
  if (target && !folders.some((f) => f.id === target)) back(here, "err", "invalid");

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
  if (target && subtree.has(target)) back(here, "err", "invalid");

  // Depth of the moved branch plus the new parent must stay within the limit.
  const height = (fid: string): number =>
    1 + Math.max(0, ...folders.filter((f) => f.parent_id === fid).map((f) => height(f.id)));
  if (folderDepth(folders, target) + height(id) > MAX_DEPTH) back(here, "err", "depth");

  const { error } = await supabase.from("analysis_folders").update({ parent_id: target }).eq("id", id).eq("user_id", userId);
  if (error) back(here, "err", "generic");
  back(here, "ok", "moved");
}

export async function deleteFolder(formData: FormData) {
  const { supabase, userId } = await context();
  const id = idOrNull(formData.get("id"));
  const here = idOrNull(formData.get("here"));
  if (!id) back(here, "err", "invalid");
  if (formData.get("confirm") !== "on") back(here, "err", "confirm");
  const { error } = await supabase.from("analysis_folders").delete().eq("id", id).eq("user_id", userId);
  if (error) back(here, "err", "generic");
  back(here === id ? null : here, "ok", "deleted");
}

/* ------------------------------------------------------------ library: files */
export async function renameFile(formData: FormData) {
  const { supabase, userId } = await context();
  const id = idOrNull(formData.get("id"));
  const title = cleanName(formData.get("title"), 120);
  const here = idOrNull(formData.get("here"));
  if (!id) back(here, "err", "invalid");
  if (!title) back(here, "err", "title");
  const { error } = await supabase.from("analysis_files").update({ title }).eq("id", id).eq("user_id", userId);
  if (error) back(here, "err", "generic");
  back(here, "ok", "renamed");
}

export async function moveFile(formData: FormData) {
  const { supabase, userId } = await context();
  const id = idOrNull(formData.get("id"));
  const target = idOrNull(formData.get("target"));
  const here = idOrNull(formData.get("here"));
  if (!id) back(here, "err", "invalid");
  if (target) {
    const folders = await loadFolders(supabase, userId);
    if (!folders.some((f) => f.id === target)) back(here, "err", "invalid");
  }
  const { error } = await supabase.from("analysis_files").update({ folder_id: target }).eq("id", id).eq("user_id", userId);
  if (error) back(here, "err", "generic");
  back(here, "ok", "moved");
}

export async function deleteFile(formData: FormData) {
  const { supabase, userId } = await context();
  const id = idOrNull(formData.get("id"));
  const here = idOrNull(formData.get("here"));
  if (!id) back(here, "err", "invalid");
  if (formData.get("confirm") !== "on") back(here, "err", "confirm");
  const { error } = await supabase.from("analysis_files").delete().eq("id", id).eq("user_id", userId);
  if (error) back(here, "err", "generic");
  back(here, "ok", "deleted");
}
