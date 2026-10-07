"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettingsContext } from "@/components/settings/SettingsProvider";

// A setting. For a signed-in account it is read from and saved to the account (every device sees the same);
// for guests it lives in the browser (localStorage). Returns [value, update, ready].
const EVENT = "wc-settings";

export function useStored<T extends object>(key: string, clean: (raw: unknown) => T): [T, (patch: Partial<T>) => void, boolean] {
  const ctx = useSettingsContext();
  const account = ctx?.mode === "account";
  const cleanRef = useRef(clean);
  cleanRef.current = clean;

  /* ---- account mode: the value comes from the provider ---- */
  const raw = account ? ctx.values[key] : undefined;
  const rawJson = JSON.stringify(raw ?? null);
  const fromAccount = useMemo(() => cleanRef.current(raw ?? null), [rawJson]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- local mode: the value comes from localStorage ---- */
  const [local, setLocal] = useState<T>(() => clean(null));
  const [loaded, setLoaded] = useState(false);
  const localRef = useRef(local);
  const localJson = useRef(JSON.stringify(local));

  useEffect(() => {
    if (account) return;
    const load = () => {
      let next: T;
      try {
        const s = localStorage.getItem(key);
        next = cleanRef.current(s ? JSON.parse(s) : null);
      } catch {
        next = cleanRef.current(null);
      }
      setLoaded(true);
      const j = JSON.stringify(next);
      if (j === localJson.current) return; // nothing changed: keep the old object so nothing re-renders
      localJson.current = j;
      localRef.current = next;
      setLocal(next);
    };
    load();
    const onEvent = (e: Event) => {
      const k = (e as CustomEvent<string>).detail;
      if (!k || k === key) load();
    };
    window.addEventListener(EVENT, onEvent);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener("storage", load);
    };
  }, [key, account]);

  const accountRef = useRef(fromAccount);
  accountRef.current = fromAccount;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const update = useCallback(
    (patch: Partial<T>) => {
      if (account) {
        const next = cleanRef.current({ ...accountRef.current, ...patch });
        accountRef.current = next;
        ctxRef.current?.set(key, next);
        return;
      }
      const next = cleanRef.current({ ...localRef.current, ...patch });
      localJson.current = JSON.stringify(next);
      localRef.current = next;
      setLocal(next);
      try {
        localStorage.setItem(key, localJson.current);
      } catch {
        /* the setting then only lasts for this visit */
      }
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    [key, account]
  );

  return account ? [fromAccount, update, true] : [local, update, loaded];
}
