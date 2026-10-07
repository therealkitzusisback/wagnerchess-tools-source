import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used by the login/register/logout actions and the confirm route.
// Kept separate from lib/supabase/server.ts so nothing you already have changes.
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component: safe to ignore, the proxy refreshes sessions.
          }
        },
      },
    }
  );
}
