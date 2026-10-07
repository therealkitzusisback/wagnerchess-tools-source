import type { Metadata } from "next";
import { cookies } from "next/headers";
import AnalysisBoard, { type InitialAnalysis } from "@/components/chess/AnalysisBoard";
import { flattenFolders, type FolderRow } from "@/lib/chess/folders";
import { railTexts } from "@/lib/chess/rail-texts";
import { layoutTexts } from "@/lib/chess/layout-texts";
import type { FileRow } from "@/components/chess/Explorer";
import { chessTexts } from "@/lib/chess/texts";
import { BOARD_COOKIE, BOARD_THEMES, pickBoard } from "@/lib/boards";
import { PIECE_COOKIE, allowedSets, pickSet } from "@/lib/pieces";
import { getLang } from "@/lib/i18n";
import { loadUserSettings } from "@/lib/settings/server";
import { seedDefaultFolders } from "@/lib/chess/seed-folders";
import { settingsTexts } from "@/lib/settings/texts";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { getViewer } from "@/lib/viewer";
import { saveAnalysis } from "../actions";

export const metadata: Metadata = { title: "Analysis Room" };

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<{ file?: string }> }) {
  const lang = await getLang();
  const t = chessTexts[lang];
  const viewer = await getViewer();
  const { file } = await searchParams;
  const sets = allowedSets(viewer.isAdmin);
  const jar = await cookies();
  // Settings of the account (the same on every device). Piece set and board of the account win over the cookie of this browser.
  const settings = await loadUserSettings(viewer.userId);
  const appearance = (settings?.appearance ?? {}) as { pieceId?: string; boardId?: string };
  const chosen = pickSet(sets, appearance.pieceId || jar.get(PIECE_COOKIE)?.value, viewer.isAdmin);
  const chosenBoard = pickBoard(appearance.boardId || jar.get(BOARD_COOKIE)?.value, viewer.isAdmin);

  let folders: FolderRow[] = [];
  let files: FileRow[] = [];
  let initial: InitialAnalysis | null = null;

  if (viewer.userId) {
    await seedDefaultFolders(viewer.userId, settings);
    const supabase = await createAuthClient();
    const { data } = await supabase.from("analysis_folders").select("id, name, parent_id").eq("user_id", viewer.userId);
    folders = (data ?? []) as FolderRow[];
    const { data: fileData } = await supabase.from("analysis_files").select("id, title, folder_id").eq("user_id", viewer.userId);
    files = (fileData ?? []) as FileRow[];

    if (file && /^[0-9a-f-]{36}$/i.test(file)) {
      const { data: row } = await supabase
        .from("analysis_files")
        .select("id, title, folder_id, pgn")
        .eq("id", file)
        .eq("user_id", viewer.userId)
        .maybeSingle();
      if (row) initial = { id: row.id as string, title: row.title as string, folderId: (row.folder_id as string | null) ?? null, pgn: row.pgn as string };
    }
  }

  return (
    <main className="container tool-page tool-wide analysis-room">
      {/* Tools have no visible heading: the address (/tools/analysisroom) shows where you are. */}
      <h1 className="visually-hidden">Analysis Room</h1>
      <AnalysisBoard
        key={initial?.id ?? "new"}
        t={t}
        x={layoutTexts[lang]}
        r={railTexts[lang]}
        st={settingsTexts[lang]}
        signedIn={Boolean(viewer.userId)}
        isAdmin={viewer.isAdmin}
        isPro={viewer.isPro}
        folders={flattenFolders(folders)}
        folderRows={folders}
        files={files}
        initial={initial}
        pieceSets={sets}
        initialPieceId={chosen.id}
        boards={BOARD_THEMES}
        initialBoardId={chosenBoard.id}
        onSave={saveAnalysis}
      />
    </main>
  );
}
