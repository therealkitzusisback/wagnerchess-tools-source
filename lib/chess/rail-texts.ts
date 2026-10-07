// Texts of the left rail of the Analysis Room (hover bar with files, databases, search and more).
export type RailTexts = {
  bar: string;
  files: string; databases: string; search: string; more: string;
  filesDialog: string;
  menu: {
    newAnalysis: string; importPgn: string; export: string; save: string; manage: string;
    openDb: string; searchInDb: string; dbSettings: string;
    pasteFen: string; searchOpenings: string; searchEndgames: string;
    flip: string; settings: string; keys: string; engineSettings: string;
  };
  db: {
    title: string; intro: string; proTag: string; soon: string; open: string; lockedPro: string; signIn: string;
    names: Record<string, string>; hints: Record<string, string>;
  };
  s: {
    title: string; placeholder: string; hint: string; chips: Record<string, string>; chipSoon: string;
    openings: string; endgames: string; position: string; loadFen: string; none: string; clipboardFail: string; soonNote: string;
  };
  m: { title: string; intro: string; groupFile: string; groupBoard: string; groupSite: string; newAnalysis: string; importPgn: string; export: string; save: string; flip: string; settings: string; keys: string; engineSettings: string; library: string };
};

export const railTexts: Record<"de" | "en", RailTexts> = {
  de: {
    bar: "Werkzeugleiste",
    files: "Dateien", databases: "Datenbanken", search: "Suche", more: "Mehr",
    filesDialog: "Dateien",
    menu: {
      newAnalysis: "Neue Analyse", importPgn: "Importieren …", export: "Exportieren …", save: "Speichern …", manage: "Ordner verwalten",
      openDb: "Datenbanken öffnen", searchInDb: "In Datenbanken suchen", dbSettings: "Datenbank-Einstellungen",
      pasteFen: "FEN aus der Zwischenablage einfügen", searchOpenings: "Eröffnung suchen", searchEndgames: "Endspiel suchen",
      flip: "Brett drehen", settings: "Einstellungen des Analyseraums", keys: "Tastenkürzel", engineSettings: "Engine-Einstellungen",
    },
    db: {
      title: "Datenbanken", intro: "Welche Datenbanken Sie öffnen können, hängt von Ihrem Konto ab.", proTag: "Pro", soon: "In Vorbereitung", open: "Öffnen",
      lockedPro: "Diese Datenbank gehört zu den Pro-Konten.", signIn: "Melden Sie sich an, um Datenbanken zu nutzen.",
      names: {
        mine: "Meine Analysen", openings: "Eröffnungsverzeichnis", tablebase: "Endspiel-Positionen", books: "Bücher und Kurse",
        masters: "Meisterpartien", online: "Online-Partien", players: "Spieler", tournaments: "Turniere",
      },
      hints: {
        mine: "Ihre gespeicherten Analysen und Ordner.", openings: "Bekannte Eröffnungen mit Zügen zum Laden.", tablebase: "Grundlegende Endspiel-Stellungen zum Üben.",
        books: "Positionen aus Büchern und Kursen.", masters: "Partien von Großmeistern, durchsuchbar nach Stellung.", online: "Partien von Online-Plattformen.",
        players: "Spielerprofile mit allen Partien.", tournaments: "Turniere mit Tabellen und Partien.",
      },
    },
    s: {
      title: "Suche", placeholder: "Spieler, Partien, Turniere, Eröffnungen, Endspiele, Bücher … oder eine FEN", hint: "Tippen Sie einen Namen oder fügen Sie eine FEN ein.",
      chips: { all: "Alles", players: "Spieler", games: "Partien", tournaments: "Turniere", openings: "Eröffnungen", endgames: "Endspiele", books: "Bücher" },
      chipSoon: "folgt mit den Datenbanken",
      openings: "Eröffnungen", endgames: "Endspiele", position: "Stellung", loadFen: "Diese Stellung laden", none: "Nichts gefunden.", clipboardFail: "Die Zwischenablage konnte nicht gelesen werden.",
      soonNote: "Spieler, Partien, Turniere und Bücher können Sie durchsuchen, sobald die Datenbanken freigeschaltet sind.",
    },
    m: {
      title: "Mehr", intro: "Weitere Werkzeuge des Analyseraums.", groupFile: "Datei", groupBoard: "Brett", groupSite: "Einstellungen", newAnalysis: "Neue Analyse", importPgn: "Importieren", export: "Exportieren", save: "Speichern",
      flip: "Brett drehen", settings: "Einstellungen des Analyseraums", keys: "Tastenkürzel", engineSettings: "Engine-Einstellungen", library: "Ordner verwalten",
    },
  },
  en: {
    bar: "Toolbar",
    files: "Files", databases: "Databases", search: "Search", more: "More",
    filesDialog: "Files",
    menu: {
      newAnalysis: "New analysis", importPgn: "Import …", export: "Export …", save: "Save …", manage: "Manage folders",
      openDb: "Open databases", searchInDb: "Search in databases", dbSettings: "Database settings",
      pasteFen: "Paste FEN from clipboard", searchOpenings: "Search openings", searchEndgames: "Search endgames",
      flip: "Flip board", settings: "Analysis Room settings", keys: "Keyboard shortcuts", engineSettings: "Engine settings",
    },
    db: {
      title: "Databases", intro: "Which databases you can open depends on your account.", proTag: "Pro", soon: "In preparation", open: "Open",
      lockedPro: "This database belongs to Pro accounts.", signIn: "Sign in to use databases.",
      names: {
        mine: "My Analyses", openings: "Opening Index", tablebase: "Endgame Positions", books: "Books and Courses",
        masters: "Master Games", online: "Online Games", players: "Players", tournaments: "Tournaments",
      },
      hints: {
        mine: "Your saved analyses and folders.", openings: "Well-known openings, ready to load.", tablebase: "Basic endgame positions to practise.",
        books: "Positions from books and courses.", masters: "Grandmaster games, searchable by position.", online: "Games from online platforms.",
        players: "Player profiles with all their games.", tournaments: "Tournaments with tables and games.",
      },
    },
    s: {
      title: "Search", placeholder: "Players, games, tournaments, openings, endgames, books … or a FEN", hint: "Type a name or paste a FEN.",
      chips: { all: "All", players: "Players", games: "Games", tournaments: "Tournaments", openings: "Openings", endgames: "Endgames", books: "Books" },
      chipSoon: "comes with the databases",
      openings: "Openings", endgames: "Endgames", position: "Position", loadFen: "Load this position", none: "Nothing found.", clipboardFail: "The clipboard could not be read.",
      soonNote: "Players, games, tournaments and books can be searched as soon as the databases are open.",
    },
    m: {
      title: "More", intro: "More tools of the Analysis Room.", groupFile: "File", groupBoard: "Board", groupSite: "Settings", newAnalysis: "New analysis", importPgn: "Import", export: "Export", save: "Save",
      flip: "Flip board", settings: "Analysis Room settings", keys: "Keyboard shortcuts", engineSettings: "Engine settings", library: "Manage folders",
    },
  },
};
