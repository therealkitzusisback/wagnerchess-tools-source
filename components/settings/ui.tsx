"use client";

import { useEffect, useState } from "react";
import { comboOf, prettyCombo } from "@/lib/chess/keybinds";
import { useSettingsMode } from "./SettingsProvider";
import "./settings.css";

// Small building blocks shared by all settings windows.

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="wc-switch" onClick={() => onChange(!checked)} />;
}

// A number box with two small buttons (+ above, - below) next to it.
export function Stepper({
  value, min, max, onChange, step, label, plus, minus, wide,
}: {
  value: number; min: number; max: number; onChange: (v: number) => void;
  step?: (v: number, dir: 1 | -1) => number; label: string; plus: string; minus: string; wide?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const move = (dir: 1 | -1) => onChange(Math.min(max, Math.max(min, value + (step ? step(value, dir) : dir))));
  const commit = () => {
    if (draft !== null) {
      const n = Number(draft);
      if (draft !== "" && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
    }
    setDraft(null);
  };
  return (
    <span className="stepper">
      <input
        className={`step-val${wide ? " wide" : ""}`}
        inputMode="numeric"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "ArrowUp") { e.preventDefault(); setDraft(null); move(1); }
          else if (e.key === "ArrowDown") { e.preventDefault(); setDraft(null); move(-1); }
        }}
      />
      <span className="step-btns">
        <button type="button" className="mini" aria-label={`${plus}: ${label}`} title={plus} disabled={value >= max} onClick={() => move(1)}>+</button>
        <button type="button" className="mini" aria-label={`${minus}: ${label}`} title={minus} disabled={value <= min} onClick={() => move(-1)}>−</button>
      </span>
    </span>
  );
}

// One row of a settings window: name and explanation on the left, the control on the right (like the Claude settings).
export function SettingRow({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="wc-row">
      <div className="wc-row-text">
        <div className="wc-row-title">{title}</div>
        {hint && <div className="wc-row-hint">{hint}</div>}
      </div>
      <div className="wc-row-control">{children}</div>
    </div>
  );
}

// The gear symbol (drawn for this site, 24 x 24).
export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="gear-icon">
      <path d="M10.02 5.08 L10.50 2.52 L13.50 2.52 L13.98 5.08 L15.49 5.70 L17.64 4.23 L19.77 6.36 L18.30 8.51 L18.92 10.02 L21.48 10.50 L21.48 13.50 L18.92 13.98 L18.30 15.49 L19.77 17.64 L17.64 19.77 L15.49 18.30 L13.98 18.92 L13.50 21.48 L10.50 21.48 L10.02 18.92 L8.51 18.30 L6.36 19.77 L4.23 17.64 L5.70 15.49 L5.08 13.98 L2.52 13.50 L2.52 10.50 L5.08 10.02 L5.70 8.51 L4.23 6.36 L6.36 4.23 L8.51 5.70 Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

// Says where the settings are saved: in the account (every device) or, for guests, in this browser only.
export function ScopeNote({ saved, local }: { saved: string; local: string }) {
  const mode = useSettingsMode();
  return <p className="wc-note">{mode === "account" ? saved : local}</p>;
}

// The keys of one action as small chips, with "+" to add a key (press it) and "x" to remove one.
export function KeyChips({
  keys, onChange, addLabel, pressLabel, removeLabel, noneLabel,
}: {
  keys: string[]; onChange: (keys: string[]) => void; addLabel: string; pressLabel: string; removeLabel: string; noneLabel: string;
}) {
  const [listening, setListening] = useState(false);
  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setListening(false);
        return;
      }
      const combo = comboOf(e);
      if (!combo) return; // only Shift, Ctrl ... pressed so far
      e.preventDefault();
      e.stopPropagation();
      if (!keys.includes(combo) && keys.length < 4) onChange([...keys, combo]);
      setListening(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [listening, keys, onChange]);
  return (
    <span className="wc-keys">
      {keys.length === 0 && !listening && <span className="wc-soon">{noneLabel}</span>}
      {keys.map((k) => (
        <span key={k} className="wc-chip">
          <kbd>{prettyCombo(k)}</kbd>
          <button type="button" aria-label={`${removeLabel}: ${prettyCombo(k)}`} title={removeLabel} onClick={() => onChange(keys.filter((x) => x !== k))}>✕</button>
        </span>
      ))}
      {listening ? (
        <span className="wc-chip listening">{pressLabel}</span>
      ) : (
        keys.length < 4 && <button type="button" className="wc-chip add" aria-label={addLabel} title={addLabel} onClick={() => setListening(true)}>+</button>
      )}
    </span>
  );
}
