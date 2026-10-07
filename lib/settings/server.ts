import "server-only";
import { cache } from "react";
import { createAuthClient } from "@/lib/supabase/auth-server";

// All settings of the signed-in account as { key: value }. null = guest, or the table does not exist yet
// (then the settings are kept in the browser instead, so nothing breaks before the database step is done).
export const loadUserSettings = cache(async (userId: string | null): Promise<Record<string, unknown> | null> => {
  if (!userId) return null;
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.from("user_settings").select("key, value").eq("user_id", userId);
    if (error) return null;
    return Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value as unknown]));
  } catch {
    return null;
  }
});
