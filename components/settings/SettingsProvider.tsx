"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { saveSetting } from "@/app/actions/settings";

// Settings of a signed-in account live in the database ("account" mode) and follow the person to every device.
// Guests keep them in their browser ("local" mode). The pages that use settings wrap their content in this provider.
type Ctx = { mode: "account" | "local"; values: Record<string, unknown>; set: (key: string, value: unknown) => void; canMulti: boolean };
const SettingsContext = createContext<Ctx | null>(null);

export function useSettingsContext() {
  return useContext(SettingsContext);
}
export function useSettingsMode(): "account" | "local" {
  return useContext(SettingsContext)?.mode ?? "local";
}

// Pro and admin accounts may use the multi-threaded chess engines.
export function useCanMulti(): boolean {
  return useContext(SettingsContext)?.canMulti ?? false;
}

export default function SettingsProvider({ initial, canMulti = false, children }: { initial: Record<string, unknown> | null; canMulti?: boolean; children: React.ReactNode }) {
  const mode = initial ? "account" : "local";
  const [values, setValues] = useState<Record<string, unknown>>(initial ?? {});
  const pending = useRef<Map<string, unknown>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const items = Array.from(pending.current.entries());
    pending.current.clear();
    for (const [k, v] of items) void saveSetting(k, v);
  }, []);

  const set = useCallback(
    (key: string, value: unknown) => {
      setValues((cur) => ({ ...cur, [key]: value }));
      pending.current.set(key, value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600); // saves a moment after the last change (not at every mouse move)
    },
    [flush]
  );

  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush(); // leaving the page: save what is still waiting
    };
  }, [flush]);

  const ctx = useMemo<Ctx>(() => ({ mode, values, set, canMulti }), [mode, values, set, canMulti]);
  return <SettingsContext.Provider value={ctx}>{children}</SettingsContext.Provider>;
}
