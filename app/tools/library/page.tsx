import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/components/chess/chess.css";
import LibraryManager, { type LibFile } from "@/components/chess/LibraryManager";
import type { FolderRow } from "@/lib/chess/folders";
import { libraryUiTexts } from "@/lib/chess/library-ui-texts";
import { libraryTexts } from "@/lib/chess/texts";
import { getLang } from "@/lib/i18n";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { getViewer } from "@/lib/viewer";
import { loadUserSettings } from "@/lib/settings/server";
import { seedDefaultFolders } from "@/lib/chess/seed-folders";

export const metadata: Metadata = { title: "My Analyses" };

export default async function LibraryPage() {
  const lang = await getLang();
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/login?next=/tools/library");

  await seedDefaultFolders(viewer.userId, await loadUserSettings(viewer.userId));
  const supabase = await createAuthClient();
  const [{ data: fData }, { data: aData }] = await Promise.all([
    supabase.from("analysis_folders").select("id, name, parent_id").eq("user_id", viewer.userId),
    supabase.from("analysis_files").select("id, title, folder_id, updated_at").eq("user_id", viewer.userId),
  ]);

  return (
    <main className="container tool-page tool-wide">
      {/* Tools have no visible heading: the address (/tools/library) shows where you are. */}
      <h1 className="visually-hidden">{libraryTexts[lang].title}</h1>
      <LibraryManager
        initialFolders={(fData ?? []) as FolderRow[]}
        initialFiles={(aData ?? []) as LibFile[]}
        t={libraryTexts[lang]}
        u={libraryUiTexts[lang]}
        lang={lang}
      />
    </main>
  );
}
