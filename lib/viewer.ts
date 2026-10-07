import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { BG_COOKIE, clampDim, isPresetId, parseBgCookie, type BgState } from "@/lib/background";
import { createAuthClient } from "@/lib/supabase/auth-server";

export type Viewer = {
  userId: string | null;
  email: string | null;
  /** When the account was created (used for the founder status). */
  createdAt: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isPro: boolean;
  /** May this account use a personal background image? (Pro and Admin) */
  canCustomize: boolean;
  /** Current background (own upload only for Pro/Admin; landscapes for everybody). Guests: from a cookie. */
  background: BgState | null;
};

const GUEST: Viewer = {
  userId: null,
  email: null,
  createdAt: null,
  displayName: null,
  isAdmin: false,
  isPro: false,
  canCustomize: false,
  background: null,
};

// Asked once per page load, then shared by the layout, header and pages (cache).
export const getViewer = cache(async (): Promise<Viewer> => {
  try {
    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ...GUEST, background: parseBgCookie((await cookies()).get(BG_COOKIE)?.value) };

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin = Boolean(profile?.is_admin);

    // Pro status comes from the entitlements view. If it cannot be read, the user counts as not Pro.
    let isPro = false;
    try {
      const { data } = await supabase
        .from("v_user_entitlements")
        .select("is_pro")
        .eq("user_id", user.id)
        .maybeSingle();
      isPro = Boolean(data?.is_pro);
    } catch {
      isPro = false;
    }

    // To let EVERY account use a background, change this one line to: const canCustomize = true;
    const canCustomize = isAdmin || isPro;

    let background: Viewer["background"] = null;
    try {
      const { data } = await supabase
        .from("user_backgrounds")
        .select("dim, image_version, preset")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const dim = clampDim(Number(data.dim));
        if (isPresetId(data.preset)) background = { kind: "preset", id: data.preset, dim };
        else if (canCustomize && Number(data.image_version) > 0) background = { kind: "upload", version: Number(data.image_version), dim };
      }
    } catch {
      background = null;
    }

    return {
      userId: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
      displayName: profile?.display_name ?? null,
      isAdmin,
      isPro,
      canCustomize,
      background,
    };
  } catch {
    return GUEST;
  }
});
