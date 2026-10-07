"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./settings.css";

// A centred window above the page (like the settings of Claude or Lichess): title in the middle, close button on the right.
// Closes with the X, the Escape key or a click next to the window.
export default function SettingsDialog({
  title, closeLabel, onClose, wide, children,
}: {
  title: string; closeLabel: string; onClose: () => void; wide?: boolean; children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMounted(true);
    const previous = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="wc-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`wc-dialog${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={box}>
        <div className="wc-dialog-head">
          <span />
          <h2>{title}</h2>
          <button type="button" className="wc-close" onClick={onClose} aria-label={closeLabel} title={closeLabel}>✕</button>
        </div>
        <div className="wc-dialog-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
