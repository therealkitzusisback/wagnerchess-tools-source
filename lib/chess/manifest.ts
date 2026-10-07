"use client";

import { useEffect, useState } from "react";
import type { EngineManifest } from "@/lib/chess/engine";

// The list of installed engines (/engine/manifest.json) is read once and shared by everything that needs it.
let manifestPromise: Promise<EngineManifest | null> | null = null;
export function loadManifest(): Promise<EngineManifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch("/engine/manifest.json", { cache: "no-cache" })
      .then((r) => (r.ok ? (r.json() as Promise<EngineManifest>) : null))
      .catch(() => null);
  }
  return manifestPromise;
}

// undefined = still loading, null = not installed
export function useManifest(): EngineManifest | null | undefined {
  const [m, setM] = useState<EngineManifest | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadManifest().then((v) => alive && setM(v));
    return () => {
      alive = false;
    };
  }, []);
  return m;
}
