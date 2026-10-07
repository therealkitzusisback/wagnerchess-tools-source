import "server-only";
import { cache } from "react";
import { createAuthClient } from "@/lib/supabase/auth-server";

// Is the German version switched on? Set in the admin panel (/admin/languages), stored in public.site_settings.
// If the setting cannot be read (table missing, database down), German counts as OFF: English is the working language.
export const germanEnabled = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createAuthClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "german_enabled").maybeSingle();
    return data?.value === "true";
  } catch {
    return false;
  }
});
