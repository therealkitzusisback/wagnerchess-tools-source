import type { Metadata } from "next";
import licenses from "@/lib/generated/licenses.json";
import { getLang } from "@/lib/i18n";
import { BOARD_THEMES } from "@/lib/boards";
import { LICENSE_TEXTS } from "@/lib/piece-license-texts";
import { PIECE_SETS } from "@/lib/pieces";
import { TOOLS_SOURCE_URL } from "@/lib/tools-source";
import { tc } from "@/lib/title";

export const metadata: Metadata = { title: "Lizenzen / Licences" };

type Entry = { label: string; version: string; text: string };

const LINKS: Record<string, string> = {
  "@lichess-org/chessground": "https://github.com/lichess-org/chessground",
  "chess.js": "https://github.com/jhlywa/chess.js",
  stockfish: "https://github.com/nmrugg/stockfish.js",
};

export default async function LicensesPage() {
  const lang = await getLang();
  const de = lang === "de";
  const entries = Object.entries(licenses as Record<string, Entry>);
  const pieceSets = PIECE_SETS.filter((s) => !s.adminOnly);
  const usedBy = (k: string) =>
    [...pieceSets.filter((s) => s.licenseKey === k).map((s) => s.name), ...(BOARD_THEMES.some((x) => x.licenseKey === k) ? [de ? "Brettdesigns" : "Board designs"] : [])].join(", ");
  const usedKeys = Array.from(new Set([...pieceSets, ...BOARD_THEMES].map((s) => s.licenseKey).filter((k) => k && LICENSE_TEXTS[k])));

  return (
    <main className="container tool-page">
      <h1>{tc(de ? "Lizenzen der Schach-Tools" : "Licences of the chess tools", lang)}</h1>
      <p className="lead">
        {de
          ? "Die Schach-Tools nutzen freie Software. Hier stehen die Originaltexte der Lizenzen samt Urheberrechtsvermerken, genau so, wie sie in der jeweils eingesetzten Version enthalten sind."
          : "The chess tools use free software. The original licence texts including copyright notices are shown here, exactly as contained in the version in use."}
      </p>

      <h2>{tc(de ? "Quellcode" : "Source code", lang)}</h2>
      <p>
        {TOOLS_SOURCE_URL ? (
          <a href={TOOLS_SOURCE_URL} rel="noreferrer noopener" target="_blank">{TOOLS_SOURCE_URL}</a>
        ) : de ? (
          "Der Quellcode der Tools wird vor dem öffentlichen Start hier verlinkt."
        ) : (
          "The source code of the tools will be linked here before the public launch."
        )}
      </p>

      <h2>{tc(de ? "Verwendete Bausteine" : "Components in use", lang)}</h2>
      {entries.length === 0 && (
        <p className="panel-note">{de ? "Die Lizenztexte werden beim nächsten Build eingesetzt (npm run chess:setup)." : "The licence texts are inserted at the next build (npm run chess:setup)."}</p>
      )}
      <ul className="lib-list">
        {entries.map(([pkg, e]) => (
          <li key={pkg} style={{ display: "block" }}>
            <p style={{ margin: "0 0 6px" }}>
              <strong>{e.label}</strong> {e.version} – <a href={LINKS[pkg]} rel="noreferrer noopener" target="_blank">{LINKS[pkg]}</a>
            </p>
            <details>
              <summary>{de ? "Originaler Lizenztext anzeigen" : "Show original licence text"}</summary>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, maxHeight: 420, overflow: "auto" }}>{e.text || (de ? "Kein Lizenztext im Paket gefunden." : "No licence text found in the package.")}</pre>
            </details>
          </li>
        ))}
      </ul>

      <h2 id="pieces">{tc(de ? "Figurensätze" : "Piece sets", lang)}</h2>
      <p>
        {de
          ? "Die folgenden Figurensätze stehen allen Besucherinnen und Besuchern zur Auswahl. Sie stammen – soweit nicht anders angegeben – unverändert aus dem Lichess-Projekt. Die Bilddateien (SVG) sind selbst der Quelltext der Figuren und können unter den angegebenen Adressen heruntergeladen werden."
          : "The following piece sets are available to all visitors. Unless stated otherwise they come unchanged from the Lichess project. The image files (SVG) are the source of the pieces and can be downloaded at the addresses given."}
      </p>
      <ul className="lib-list">
        {pieceSets.map((s) => (
          <li key={s.id} id={`piece-${s.id}`} style={{ display: "block" }}>
            <p style={{ margin: "0 0 4px" }}>
              <strong>{de ? "Figurensatz" : "Piece set"} „{s.name}“</strong> – {s.author}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 14 }}>
              {s.copyright} · {de ? "Lizenz" : "Licence"}:{" "}
              <a href={s.licenseUrl} rel="noreferrer noopener" target="_blank">{s.license}</a>
              {s.licenseKey ? <> ({de ? "voller Text unten" : "full text below"})</> : null}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 14 }}>
              {de ? "Quelle" : "Source"}: <a href={s.source} rel="noreferrer noopener" target="_blank">{s.source}</a>
              {" · "}
              <a href={`/pieces/${s.id}/wK.${s.ext}`} target="_blank" rel="noreferrer noopener">{de ? "Dateien auf dieser Website" : "files on this website"}</a>
            </p>
            {s.modified && (
              <p style={{ margin: 0, fontSize: 14 }}>
                {de ? "Änderung durch WagnerChess" : "Changed by WagnerChess"}: {s.modified}
              </p>
            )}
          </li>
        ))}
      </ul>

      <h2 id="boards">{tc(de ? "Brettdesigns" : "Board designs", lang)}</h2>
      <p>
        {de
          ? "Die Brettdesigns stammen unverändert aus dem Lichess-Projekt (Verzeichnis public/images/board) und stehen unter der AGPLv3+. Die Bilddateien sind selbst der Quelltext der Bretter und können unter den angegebenen Adressen heruntergeladen werden."
          : "The board designs come unchanged from the Lichess project (folder public/images/board) and are licensed under the AGPLv3+. The image files are the source of the boards and can be downloaded at the addresses given."}
      </p>
      <ul className="lib-list">
        {BOARD_THEMES.map((x) => (
          <li key={x.id} id={`board-${x.id}`} style={{ display: "block" }}>
            <p style={{ margin: "0 0 4px" }}>
              <strong>{de ? "Brett" : "Board"} „{x.name}“</strong> – {x.author}
            </p>
            <p style={{ margin: 0, fontSize: 14 }}>
              {x.copyright} · {de ? "Lizenz" : "Licence"}: <a href={x.licenseUrl} rel="noreferrer noopener" target="_blank">{x.license}</a> ({de ? "voller Text unten" : "full text below"})
              {" · "}
              <a href={x.source} rel="noreferrer noopener" target="_blank">{de ? "Quelle" : "Source"}</a>
              {" · "}
              <a href={`/boards/${x.file}`} target="_blank" rel="noreferrer noopener">{de ? "Datei auf dieser Website" : "file on this website"}</a>
            </p>
          </li>
        ))}
      </ul>

      <h2 id="licence-texts">{tc(de ? "Lizenztexte" : "Licence texts", lang)}</h2>
      <ul className="lib-list">
        {usedKeys.map((k) => (
          <li key={k} style={{ display: "block" }}>
            <details>
              <summary>
                <strong>{LICENSE_TEXTS[k].title}</strong>
                {" – "}
                {usedBy(k)}
              </summary>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, maxHeight: 420, overflow: "auto" }}>{LICENSE_TEXTS[k].text}</pre>
            </details>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 14 }}>
        {de
          ? "Die Sätze „Papercut“ (CC BY 4.0) und „Shapes“ (CC BY-SA 4.0) stehen unter Creative-Commons-Lizenzen. Deren vollständige Texte sind über die oben verlinkten Lizenzseiten abrufbar. Bei „Shapes“ gilt die Weitergabe unter gleichen Bedingungen (SA) für Bearbeitungen der Figuren."
          : "The sets “Papercut” (CC BY 4.0) and “Shapes” (CC BY-SA 4.0) are licensed under Creative Commons. Their complete texts are available at the licence pages linked above. For “Shapes”, adaptations of the pieces must be shared under the same terms (SA)."}
      </p>
    </main>
  );
}
