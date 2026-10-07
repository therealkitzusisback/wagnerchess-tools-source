// Copies the chess engine (Stockfish) and the board styles out of node_modules into the website.
// Runs automatically after "npm install" (also on Vercel). It never stops the installation:
// if something is missing it only prints a warning.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "public", "engine");
const log = (m) => console.log(`[chess-setup] ${m}`);

function copyChessgroundCss() {
  const candidates = [
    "node_modules/@lichess-org/chessground/assets/chessground.base.css",
    "node_modules/chessground/assets/chessground.base.css",
  ];
  const found = candidates.map((c) => path.join(root, c)).find((c) => fs.existsSync(c));
  if (!found) return log("WARNING: chessground is not installed yet (no board styles copied).");
  fs.copyFileSync(found, path.join(root, "components", "chess", "vendor-chessground.css"));
  log("Board styles copied.");
}

function walk(dir, depth = 0) {
  if (!fs.existsSync(dir) || depth > 3) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, depth + 1) : [p];
  });
}

function copyEngine() {
  const pkgDir = path.join(root, "node_modules", "stockfish");
  if (!fs.existsSync(pkgDir)) return log("WARNING: stockfish is not installed yet (engine not copied).");
  const version = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")).version;
  const files = walk(pkgDir);
  const js = files.filter((f) => f.endsWith(".js"));

  // Single-threaded builds run everywhere (no special server headers needed).
  // Multi-threaded builds (several processor cores) need the page to be cross-origin isolated (headers in proxy.ts).
  const name = (f) => path.basename(f);
  const notAsm = (f) => !/asm/i.test(name(f));
  const lite = js.find((f) => /lite/i.test(name(f)) && /single/i.test(name(f)));
  const full = js.find((f) => !/lite/i.test(name(f)) && /single/i.test(name(f)) && notAsm(f));
  const liteMulti = js.find((f) => /lite/i.test(name(f)) && !/single/i.test(name(f)) && notAsm(f));
  const fullMulti = js.find((f) => !/lite/i.test(name(f)) && !/single/i.test(name(f)) && notAsm(f));

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const manifest = { version };

  const take = (jsFile, key) => {
    if (!jsFile) return;
    const base = path.basename(jsFile, ".js");
    let bytes = 0;
    // the script itself and its companions ("<name>.wasm" ...), but not other builds whose name only starts the same way
    for (const f of files.filter((x) => path.basename(x).startsWith(base + "."))) {
      fs.copyFileSync(f, path.join(out, path.basename(f)));
      bytes += fs.statSync(f).size;
    }
    manifest[key] = { file: path.basename(jsFile), sizeMB: Math.round((bytes / 1048576) * 10) / 10 };
  };
  take(lite, "lite");
  take(liteMulti, "liteMulti");
  // The full engine (single-threaded) is large (about 75 to 110 MB) but part of the site: everybody may use it.
  // To leave it out (smaller deployment) set CHESS_SKIP_FULL=1 before the build.
  if (process.env.CHESS_SKIP_FULL === "1") log("Full engine skipped (CHESS_SKIP_FULL=1).");
  else take(full, "full");
  // The full multi-threaded engine is even larger (over 100 MB): only copied when you ask for it (CHESS_FULL=1). Pro accounts only.
  if (process.env.CHESS_FULL === "1") take(fullMulti, "fullMulti");
  else if (fullMulti) log("Full multi-thread engine (over 100 MB) skipped. Set CHESS_FULL=1 to include it.");
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

  if (!manifest.lite && !manifest.full) {
    log("WARNING: no single-threaded Stockfish build found. Files in the package:");
    files.slice(0, 40).forEach((f) => log("  " + path.relative(pkgDir, f)));
    log("Please send this list to Claude.");
  } else {
    log(`Stockfish ${version} copied: ${JSON.stringify(manifest)}`);
  }
}

// Copies the ORIGINAL licence texts of the packages into lib/generated/licenses.json,
// so the page /tools/licenses always shows the exact text of the installed version.
function collectLicenses() {
  const packages = [
    ["@lichess-org/chessground", "Chessground"],
    ["chess.js", "chess.js"],
    ["stockfish", "Stockfish (stockfish.js)"],
  ];
  const names = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "COPYING.txt", "Copying.txt", "License.txt", "license"];
  const result = {};
  for (const [pkg, label] of packages) {
    const dir = path.join(root, "node_modules", ...pkg.split("/"));
    if (!fs.existsSync(dir)) continue;
    const version = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version;
    const file = names.map((n) => path.join(dir, n)).find((f) => fs.existsSync(f));
    result[pkg] = { label, version, text: file ? fs.readFileSync(file, "utf8") : "" };
  }
  fs.mkdirSync(path.join(root, "lib", "generated"), { recursive: true });
  fs.writeFileSync(path.join(root, "lib", "generated", "licenses.json"), JSON.stringify(result, null, 2));
  log(`Licence texts collected: ${Object.keys(result).join(", ") || "none"}`);
}

try {
  copyChessgroundCss();
  copyEngine();
  collectLicenses();
} catch (e) {
  log("WARNING: " + (e instanceof Error ? e.message : String(e)));
}
