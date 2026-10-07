// Title Case for English headings and titles ("Training plan" -> "Training Plan"). German texts stay as they are
// (German has its own rules: nouns are capitalised already, other words are not).
// Short words (a, and, of, to ...) stay small unless they are the first or last word or follow a colon / dash.
// Words that already contain capitals inside (FEN, PGN, WagnerChess, iPad) and words with digits are left alone.
const SMALL = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "as", "at", "by", "in", "of", "on", "to", "up", "via", "vs", "vs.", "per", "off", "out", "with", "from", "into", "over",
]);

function cap(word: string): string {
  const i = word.search(/[A-Za-z]/);
  if (i < 0) return word;
  const rest = word.slice(i + 1);
  if (/[A-Z]/.test(rest) || /\d/.test(word)) return word; // FEN, PGN, WagnerChess, 60-minute
  return word.slice(0, i) + word[i].toUpperCase() + rest;
}

export function titleCase(text: string, lang: string = "en"): string {
  if (lang !== "en" || !text) return text;
  const parts = text.split(/(\s+)/);
  const wordIdx = parts.flatMap((p, i) => (/\S/.test(p) ? [i] : []));
  const last = wordIdx[wordIdx.length - 1];
  let afterBreak = true;
  return parts
    .map((p, i) => {
      if (!/\S/.test(p)) return p;
      const plain = p.replace(/^[^A-Za-z]+|[^A-Za-z.]+$/g, "").toLowerCase();
      const force = afterBreak || i === last;
      afterBreak = /[:–—]$/.test(p);
      if (!force && SMALL.has(plain)) return p;
      return p.split("-").map((seg, k) => (k > 0 && SMALL.has(seg.toLowerCase()) ? seg : cap(seg))).join("-"); // Step-by-Step
    })
    .join("");
}

export const tc = titleCase;
