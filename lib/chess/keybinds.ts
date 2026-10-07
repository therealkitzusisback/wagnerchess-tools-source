// Keyboard shortcuts of the Analysis Room. Every visitor can change them
// in the Analysis Room Settings (saved with the account). One action can have several keys.

export type KeyAction =
  | "back" | "forward" | "first" | "last" | "prevBranch" | "nextBranch"
  | "flip" | "toggleArrows" | "toggleEngine" | "playBest" | "toggleEvalBar" | "deleteMove" | "help";

export const KEY_ACTIONS: KeyAction[] = [
  "back", "forward", "first", "last", "prevBranch", "nextBranch",
  "flip", "toggleArrows", "toggleEngine", "playBest", "toggleEvalBar", "deleteMove", "help",
];

// Key names: "ArrowLeft", "k", "shift+ArrowRight", "ctrl+z", "space" ... (modifiers in the order ctrl, alt, shift, meta)
export const DEFAULT_KEYS: Record<KeyAction, string[]> = {
  back: ["ArrowLeft"],
  forward: ["ArrowRight"],
  first: ["ArrowUp"],
  last: ["ArrowDown"],
  prevBranch: ["shift+ArrowLeft"],
  nextBranch: ["shift+ArrowRight"],
  flip: ["f"],
  toggleArrows: ["a"],
  toggleEngine: ["s"],
  playBest: ["space"],
  toggleEvalBar: ["b"],
  deleteMove: ["Delete"],
  help: ["h"],
};

export const KEYBINDS_KEY = "keybinds";
export type Keybinds = Record<KeyAction, string[]>;

export function cleanKeybinds(raw: unknown): Keybinds {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = {} as Keybinds;
  for (const a of KEY_ACTIONS) {
    const v = r[a];
    out[a] = Array.isArray(v)
      ? Array.from(new Set(v.filter((k): k is string => typeof k === "string" && k.length > 0 && k.length <= 24))).slice(0, 4)
      : [...DEFAULT_KEYS[a]]; // never set: the default (an empty list means "deliberately no key")
  }
  return out;
}

const MODIFIER_KEYS = ["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock"];

// The name of a key press, e.g. "shift+ArrowLeft". null = only a modifier key was pressed.
export function comboOf(e: { key: string; ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean }): string | null {
  if (MODIFIER_KEYS.includes(e.key)) return null;
  const key = e.key === " " ? "space" : e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const letterOrDigit = /^[a-z0-9]$/.test(key);
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey && (letterOrDigit || key.length > 1)) parts.push("shift"); // "$" or "?" already contain the shift
  if (e.metaKey) parts.push("meta");
  parts.push(key);
  return parts.join("+");
}

const NAMES: Record<string, string> = {
  ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", space: "Space", Escape: "Esc", Delete: "Del", Backspace: "⌫", Enter: "Enter",
  PageUp: "PgUp", PageDown: "PgDn", Home: "Home", End: "End", Tab: "Tab",
};
export function prettyCombo(combo: string): string {
  return combo
    .split("+")
    .map((p) => NAMES[p] ?? (p.length === 1 ? p.toUpperCase() : p === "ctrl" ? "Ctrl" : p === "alt" ? "Alt" : p === "shift" ? "Shift" : p === "meta" ? "Meta" : p))
    .join(" + ");
}
