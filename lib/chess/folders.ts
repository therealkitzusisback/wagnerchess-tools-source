export type FolderRow = { id: string; name: string; parent_id: string | null };
export type FolderOption = { id: string; label: string; depth: number };

// Puts the folders in tree order with an indent, e.g. for a drop-down list.
export function flattenFolders(folders: FolderRow[]): FolderOption[] {
  const byParent = new Map<string | null, FolderRow[]>();
  for (const f of folders) {
    const list = byParent.get(f.parent_id) ?? [];
    list.push(f);
    byParent.set(f.parent_id, list);
  }
  const out: FolderOption[] = [];
  const visit = (parent: string | null, depth: number) => {
    const children = (byParent.get(parent) ?? []).sort((a, b) => a.name.localeCompare(b.name, "de"));
    for (const f of children) {
      out.push({ id: f.id, label: `${"– ".repeat(depth)}${f.name}`, depth });
      if (depth < 8) visit(f.id, depth + 1);
    }
  };
  visit(null, 0);
  return out;
}

export function folderDepth(folders: FolderRow[], id: string | null): number {
  const map = new Map(folders.map((f) => [f.id, f]));
  let depth = 0;
  let cur = id ? map.get(id) : undefined;
  while (cur && depth < 20) {
    depth += 1;
    cur = cur.parent_id ? map.get(cur.parent_id) : undefined;
  }
  return depth;
}
