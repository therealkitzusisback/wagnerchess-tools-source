"use server";

import { createAuthClient } from "@/lib/supabase/auth-server";

// Saves ONE setting of the signed-in account. Only known setting names are accepted and every setting is small.
const KEY_RE = /^(engineSettings|roomSettings|layout|keybinds|appearance|engineWindow\.[1-9])$/;

export async function saveSetting(key: string, value: unknown): Promise<{ ok: boolean }> {
  if (typeof key !== "string" || !KEY_RE.test(key)) return { ok: false };
  let size = 0;
  try {
    size = JSON.stringify(value)?.length ?? 0;
  } catch {
    return { ok: false };
  }
  if (size === 0 || size > 20000) return { ok: false };
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}
