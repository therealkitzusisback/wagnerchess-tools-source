export const toolsNav = { de: "Tools", en: "Tools" } as const;

export type ToolCard = { href: string | null; title: string; body: string; badge?: string };

export const toolsPage: Record<"de" | "en", { title: string; lead: string; guestNote: string; cards: ToolCard[] }> = {
  de: {
    title: "Tools",
    lead: "Werkzeuge für Ihr Schachtraining. Alle Tools stehen allen Besuchern offen. Gespeichert wird nur mit einem Konto.",
    guestNote: "Sie sind nicht angemeldet: Sie können alles ausprobieren, Ihre Arbeit wird aber nicht gespeichert.",
    cards: [
      { href: "/tools/analysisroom", title: "Analysis Room", body: "Der Raum für Analyse auf höchstem Niveau: Stellungen und Partien analysieren – mit Stockfish direkt in Ihrem Browser, Varianten, PGN-Import und -Export." },
      { href: "/tools/library", title: "Meine Analysen", body: "Ihre gespeicherten Analysen in Ihrer eigenen Ordnerstruktur. Anmeldung erforderlich." },
      { href: null, title: "Eröffnungsstatistik", body: "Wie oft wird welcher Zug gespielt – nach Wertungsgruppe.", badge: "Bald" },
      { href: null, title: "Taktiktrainer", body: "Aufgaben lösen und Muster trainieren.", badge: "Bald" },
    ],
  },
  en: {
    title: "Tools",
    lead: "Tools for your chess training. Everyone can use them; saving needs an account.",
    guestNote: "You are not logged in: you can try everything, but your work is not saved.",
    cards: [
      { href: "/tools/analysisroom", title: "Analysis Room", body: "The room for analysis at the highest level: analyse positions and games with Stockfish right in your browser, variations, PGN import and export." },
      { href: "/tools/library", title: "My Analyses", body: "Your saved analyses in your own folder structure. Login required." },
      { href: null, title: "Opening Statistics", body: "How often each move is played – by rating group.", badge: "Soon" },
      { href: null, title: "Tactics Trainer", body: "Solve puzzles and train patterns.", badge: "Soon" },
    ],
  },
};
