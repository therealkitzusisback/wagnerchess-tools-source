// Downloads the 12 piece pictures of a Lichess piece set into public/pieces/<name>.
// Usage:  npm run pieces -- cburnett
// Most sets are .svg, a few are .webp (the script tries both).
import fs from "node:fs";
import path from "node:path";

const name = process.argv[2];
if (!name) {
  console.log("Please give the name of the piece set, for example:  npm run pieces -- cburnett");
  process.exit(1);
}
const dir = path.join(process.cwd(), "public", "pieces", name);
fs.mkdirSync(dir, { recursive: true });
const names = ["wK", "wQ", "wR", "wB", "wN", "wP", "bK", "bQ", "bR", "bB", "bN", "bP"];
let failed = 0;
let ext = "";
for (const n of names) {
  let done = false;
  for (const e of ["svg", "webp"]) {
    const url = `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${name}/${n}.${e}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    fs.writeFileSync(path.join(dir, `${n}.${e}`), Buffer.from(await res.arrayBuffer()));
    console.log(`ok ${n}.${e}`);
    ext = e;
    done = true;
    break;
  }
  if (!done) {
    console.log(`FAILED ${n} - does the set "${name}" exist?`);
    failed += 1;
  }
}
if (failed) process.exit(1);
console.log(`Done (${ext}). Files are in public/pieces/${name}. A set must be listed in lib/pieces.ts (PIECE_SETS) to appear in the selection.`);
