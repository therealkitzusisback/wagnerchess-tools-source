// Settings for the personal background image (Pro and Admin accounts).
export const BACKGROUND_BUCKET = "backgrounds";

// Browsers shrink the picture before upload, so this limit is rarely reached.
// (Hosting platforms reject uploads of roughly 4.5 MB and more, so stay below that.)
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_EDGE = 2400; // longest side in pixels after shrinking

// How strongly the picture is darkened, in percent. Dark text areas stay readable.
export const MIN_DIM = 50;
export const MAX_DIM = 90;
export const DEFAULT_DIM = 80;

export function clampDim(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DIM;
  return Math.min(MAX_DIM, Math.max(MIN_DIM, Math.round(n)));
}

export function backgroundPath(userId: string): string {
  return `${userId}/background`;
}

// Ready-made landscapes (files in public/images/landscapes/<id>.webp). Choosing one copies it into the person's own storage,
// so the rest of the background system works exactly as with an uploaded picture.
export const PRESETS: { id: string; de: string; en: string }[] = [
  { id: "01_alpengluehen-morgenrot", de: "Alpenglühen im Morgenrot", en: "Alpenglow at Dawn" },
  { id: "02_bergsee-abendlicht", de: "Bergsee im Abendlicht", en: "Mountain Lake at Dusk" },
  { id: "03_sommerhuegel", de: "Sanfte Sommerhügel", en: "Gentle Summer Hills" },
  { id: "04_wuestenduenen", de: "Wüstendünen", en: "Desert Dunes" },
  { id: "05_nebelwald", de: "Nebelwald", en: "Misty Forest" },
  { id: "06_polarlicht", de: "Polarlicht über dem See", en: "Northern Lights over a Lake" },
  { id: "07_kueste-sonnenuntergang", de: "Küste bei Sonnenuntergang", en: "Coast at Sunset" },
  { id: "08_winterberge", de: "Winterberge", en: "Winter Mountains" },
  { id: "09_herbsttal", de: "Herbsttal", en: "Autumn Valley" },
  { id: "10_fjord-blaue-stunde", de: "Fjord zur blauen Stunde", en: "Fjord at Blue Hour" },
];

export const presetUrl = (id: string) => `/images/landscapes/${id}.webp`;

// What is currently set as background: an own upload (Pro/Admin only) or one of the ready-made landscapes (everybody).
export type BgState = { kind: "upload"; version: number; dim: number } | { kind: "preset"; id: string; dim: number };

export const isPresetId = (id: unknown): id is string => typeof id === "string" && PRESETS.some((p) => p.id === id);

// Guests keep their choice in a small cookie "<preset id>.<dimming>" (the server validates it every time).
export const BG_COOKIE = "wc_bg";
export function parseBgCookie(value: string | undefined): BgState | null {
  if (!value) return null;
  const [id, d] = value.split(".");
  if (!isPresetId(id)) return null;
  return { kind: "preset", id, dim: clampDim(Number(d)) };
}
export const bgCookieValue = (id: string, dim: number) => `${id}.${clampDim(dim)}`;
