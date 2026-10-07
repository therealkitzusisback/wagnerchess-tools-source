"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RailTexts } from "@/lib/chess/rail-texts";

export type RailId = "files" | "databases" | "search" | "more";
export type RailAction = { label: string; run: () => void; disabled?: boolean };

const ICONS: Record<RailId, React.ReactNode> = {
  files: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l1.8 2H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />,
  databases: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" />
      <path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="18.5" cy="12" r="1.3" />
    </>
  ),
};

// A narrow vertical bar at the left edge of the screen (half as wide as the frame). It opens wider when the mouse is over it.
// Left click opens a window of this website, right click shows quick actions.
export default function RoomRail({ t, onOpen, actions }: { t: RailTexts; onOpen: (id: RailId) => void; actions: Record<RailId, RailAction[]> }) {
  const [menu, setMenu] = useState<{ id: RailId; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [menu]);
  const ids: RailId[] = ["databases", "files", "search", "more"]; // alphabetical, but "More" always stays at the end
  return (
    <nav className="room-rail" aria-label={t.bar}>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          className="rail-btn"
          aria-haspopup="dialog"
          title={t[id]}
          onClick={() => onOpen(id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ id, x: Math.min(e.clientX, window.innerWidth - 270), y: Math.min(e.clientY, window.innerHeight - 220) });
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[id]}</svg>
          <span className="rail-label">{t[id]}</span>
        </button>
      ))}
      {menu && createPortal(
        <div className="lm-menu rail-menu" role="menu" style={{ left: menu.x, top: menu.y }} onPointerDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
          {actions[menu.id].map((a) => (
            <button key={a.label} type="button" role="menuitem" disabled={a.disabled} onClick={() => { setMenu(null); a.run(); }}>{a.label}</button>
          ))}
        </div>,
        document.body
      )}
    </nav>
  );
}
