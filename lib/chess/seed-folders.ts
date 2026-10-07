import "server-only";
import { createAuthClient } from "@/lib/supabase/auth-server";

// New accounts get a few folders to start with:
//   My Repertoire (Black, White), My Games, My Analysis
// Only done once, and only while the account has no folders and no analyses yet (existing accounts are never touched).
export async function seedDefaultFolders(userId: string | null, settings: Record<string, unknown> | null): Promise<void> {
  if (!userId) return;
  if (settings && "foldersSeeded" in settings) return;
  try {
    const supabase = await createAuthClient();
    const [{ count: fc }, { count: ac }] = await Promise.all([
      supabase.from("analysis_folders").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("analysis_files").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    if ((fc ?? 0) > 0 || (ac ?? 0) > 0) {
      if (settings) await supabase.from("user_settings").upsert({ user_id: userId, key: "foldersSeeded", value: { done: true } });
      return;
    }
    const { data: rep } = await supabase.from("analysis_folders").insert({ user_id: userId, name: "My Repertoire", parent_id: null }).select("id").single();
    const rows = [
      { user_id: userId, name: "My Games", parent_id: null },
      { user_id: userId, name: "My Analysis", parent_id: null },
    ] as { user_id: string; name: string; parent_id: string | null }[];
    if (rep?.id) {
      rows.push({ user_id: userId, name: "Black", parent_id: rep.id }, { user_id: userId, name: "White", parent_id: rep.id });
    }
    await supabase.from("analysis_folders").insert(rows);
    if (settings) await supabase.from("user_settings").upsert({ user_id: userId, key: "foldersSeeded", value: { done: true } });
  } catch {
    // never block the page because of this
  }
}
