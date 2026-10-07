import type { Metadata } from "next";
import Link from "next/link";
import "@/components/chess/chess.css";
import { getLang } from "@/lib/i18n";
import { toolsPage } from "@/lib/tools-texts";
import { getViewer } from "@/lib/viewer";
import { tc } from "@/lib/title";

export const metadata: Metadata = { title: "Tools" };

export default async function ToolsPage() {
  const lang = await getLang();
  const t = toolsPage[lang];
  const viewer = await getViewer();

  return (
    <main className="container tool-page">
      <h1>{tc(t.title, lang)}</h1>
      <p className="lead">{t.lead}</p>
      {!viewer.userId && <p className="panel-note">{t.guestNote}</p>}

      <div className="tools-grid">
        {t.cards.map((c) =>
          c.href ? (
            <Link key={c.title} href={c.href} className="tool-card">
              <h2>{tc(c.title, lang)}</h2>
              <p>{c.body}</p>
            </Link>
          ) : (
            <div key={c.title} className="tool-card soon" aria-disabled="true">
              {c.badge && <span className="badge">{c.badge}</span>}
              <h2>{tc(c.title, lang)}</h2>
              <p>{c.body}</p>
            </div>
          )
        )}
      </div>
    </main>
  );
}
