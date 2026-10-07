// Clock times of the moves ("remaining time after the move"). They are kept in the PGN as [%clk h:mm:ss] inside the comment of the move.

// 3725 -> "1:02:05", 59.5 -> "0:00:59.5"
export function clockToPgn(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const s = Math.floor(tenths / 10);
  const frac = tenths % 10;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}${frac ? `.${frac}` : ""}`;
}

// What is shown in the scoresheet: 3725 -> "1:02:05", 125 -> "2:05", 9.5 -> "0:09.5"
export function clockLabel(seconds: number): string {
  const pgn = clockToPgn(seconds);
  return pgn.startsWith("0:") ? pgn.slice(2) : pgn;
}

// What is shown in the scoresheet: whole minutes (75 for 1:15:00, 5 for 5:30). Under one minute: "<1".
export function clockMinutes(seconds: number): string {
  return seconds < 60 ? "<1" : String(Math.floor(seconds / 60));
}
// What is offered when a time is edited: minutes, with decimals only when needed (75, 5.5).
export function clockMinutesEdit(seconds: number): string {
  return String(Math.round((seconds / 60) * 100) / 100);
}

// Reads minutes ("75", "5.5") or "1:02:05", "2:05" (minutes:seconds), "0:09.5". Returns null when it makes no sense.
export function parseClock(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t) * 60; // a plain number means minutes
  const parts = t.split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length > 1 && nums.slice(1).some((n) => n >= 60)) return null;
  return nums.reduce((acc, n) => acc * 60 + n, 0);
}

// Finds [%clk ...] in the text of a PGN comment.
export function clockFromComment(raw: string): number | null {
  const m = raw.match(/\[%clk\s+(\d+:\d{1,2}:\d{1,2}(?:\.\d+)?|\d{1,2}:\d{1,2}(?:\.\d+)?)\s*\]/);
  return m ? parseClock(m[1]) : null;
}
