import type { FolderRow } from "@/lib/chess/folders";

// Search in a folder tree: returns the analyses whose title matches and the folders that lead to them (or match themselves).
// null = no search text, everything is shown.
export function filterTree(
  folders: FolderRow[],
  files: { id: string; title: string; folder_id: string | null }[],
  query: string
): { fileIds: Set<string>; folderIds: Set<string>; matchedFolders: Set<string> } | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const fileIds = new Set(files.filter((f) => f.title.toLowerCase().includes(q)).map((f) => f.id));
  const folderIds = new Set<string>();
  const matchedFolders = new Set<string>();
  const byId = new Map(folders.map((f) => [f.id, f]));
  const addChain = (id: string | null) => {
    let cur = id;
    while (cur && !folderIds.has(cur)) {
      folderIds.add(cur);
      cur = byId.get(cur)?.parent_id ?? null;
    }
  };
  for (const f of files) if (fileIds.has(f.id)) addChain(f.folder_id);
  for (const f of folders) {
    if (f.name.toLowerCase().includes(q)) {
      matchedFolders.add(f.id);
      addChain(f.id);
    }
  }
  return { fileIds, folderIds, matchedFolders };
}
