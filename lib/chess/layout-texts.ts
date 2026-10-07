// Texts for the three-column layout of the analysis page (file tree, board, notation + engines).
export type LayoutTexts = {
  explorer: {
    title: string; newAnalysis: string; search: string; manage: string; empty: string; guest: string; login: string; resize: string;
    leave: string; rootFiles: string; moves: string;
  };
  notation: {
    title: string; empty: string; resizeRight: string;
    commentTitle: string; commentBefore: string; commentAfter: string; commentPlaceholder: string; commentStart: string; commentOf: string;
    symbolsMove: string; symbolsPosition: string; scoresheet: string; symbolsTab: string; promote: string; demote: string; makeMain: string; deleteMove: string; nags: Record<string, string>;
  };
  tabs: { import: string; export: string; info: string; save: string; clocks: string };
  boardShift: string;
  clock: { hint: string; dontShow: string; hideHint: string; edit: string; empty: string; alternatives: string; hasComment: string };
  move: { handle: string; drop: string; newColumn: string };
  importTabs: { pgn: string; fen: string; pgnHint: string; fenHint: string; fenPlaceholder: string };
  export: { copyPgn: string; downloadPgn: string; copyFen: string; copyMoves: string; copied: string };
  info: { event: string; site: string; date: string; white: string; black: string; result: string; note: string; newTag: string; removeTag: string; resultNone: string };
  engines: { window: string; add: string; remove: string; maxReached: string; proOnly: string; moreLater: string };
  engineUi: {
    gear: string; switchLabel: string; modeDepth: string; modeTime: string; modeInfinite: string; unitSeconds: string; plus: string; minus: string;
    arrows: string; arrowAll: string; arrowBest: string; arrowOff: string; line: string; colorNote: string; movesShown: string; hash: string;
    strength: string; reset: string; fit: string; resizeRows: string; limitLabel: string;
  };
};

export const layoutTexts: Record<"de" | "en", LayoutTexts> = {
  de: {
    explorer: {
      title: "Meine Analysen", newAnalysis: "Neue Analyse", search: "Analysen suchen …", manage: "Verwalten", empty: "Noch keine gespeicherten Analysen.",
      guest: "Melden Sie sich an, um Ihre Ordner und gespeicherten Analysen hier zu sehen.", login: "Anmelden",
      resize: "Breite der Ordneransicht ändern", leave: "Es gibt ungespeicherte Änderungen. Trotzdem wechseln?", rootFiles: "Ohne Ordner",
      moves: "Züge",
    },
    notation: {
      title: "Notation", empty: "Noch keine Züge.", resizeRight: "Breite der Notationsspalte ändern",
      commentTitle: "Kommentar", commentBefore: "Text vor dem Zug", commentAfter: "Text nach dem Zug", commentPlaceholder: "Kommentar zum gewählten Zug …", commentStart: "Kommentar zur Ausgangsstellung", commentOf: "Kommentar zu",
      symbolsMove: "Zugbewertung", symbolsPosition: "Stellungsbewertung", scoresheet: "Partieformular", symbolsTab: "Symbole", promote: "Variante nach oben", demote: "Variante nach unten", makeMain: "Zum Hauptzug machen", deleteMove: "Zug löschen",
      nags: {
        "1": "Guter Zug (!)", "2": "Fehler (?)", "3": "Hervorragender Zug (!!)", "4": "Grober Fehler (??)", "5": "Interessanter Zug (!?)", "6": "Zweifelhafter Zug (?!)", "7": "Einziger Zug (□)",
        "10": "Ausgeglichen (=)", "13": "Unklar (∞)", "14": "Weiß steht etwas besser (⩲)", "15": "Schwarz steht etwas besser (⩱)", "16": "Weiß steht besser (±)", "17": "Schwarz steht besser (∓)",
        "18": "Weiß steht auf Gewinn (+−)", "19": "Schwarz steht auf Gewinn (−+)", "146": "Neuerung (N)",
      },
    },
    tabs: { import: "Import", export: "Export", info: "Partie-Infos", save: "Speichern", clocks: "Bedenkzeit" },
    boardShift: "Brett seitlich verschieben",
    clock: { hint: "Tragen Sie die Restminuten nach jedem Zug in die Felder ein (75 oder 5,5). Eigene Zeiten erscheinen in der Notation als ganze Minuten; die genauen Zeiten einer importierten Partie bleiben genau.", dontShow: "Nicht mehr anzeigen", hideHint: "Text ausblenden", edit: "Zeit ändern", empty: "–", alternatives: "Anderer Zug an dieser Stelle – klicken zum Wechseln", hasComment: "Hat einen Kommentar" },
    importTabs: { pgn: "PGN", fen: "FEN", pgnHint: "Fügen Sie eine ganze Partie (PGN) mit Zügen, Varianten und Kommentaren ein.", fenHint: "Fügen Sie eine einzelne Stellung (FEN) ein, um die Analyse von dort zu beginnen.", fenPlaceholder: "z. B. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
    move: { handle: "Fenster verschieben (ziehen oder Pfeiltasten)", drop: "Hier ablegen", newColumn: "Neue Spalte" },
    export: { copyPgn: "PGN kopieren", downloadPgn: "PGN herunterladen", copyFen: "FEN kopieren", copyMoves: "Züge kopieren", copied: "Kopiert." },
    info: { event: "Turnier / Ereignis", site: "Ort", date: "Datum", white: "Weiß", black: "Schwarz", result: "Ergebnis", note: "Diese Angaben werden im PGN gespeichert und exportiert.", newTag: "Neuer Tag", removeTag: "Tag entfernen", resultNone: "Offen" },
    engines: {
      window: "Engine", add: "Engine-Fenster hinzufügen", remove: "Fenster schließen", maxReached: "Mehr Fenster sind nicht möglich.",
      proOnly: "Mehrere Engine-Fenster sind für Pro-Konten verfügbar.", moreLater: "Weitere Engines folgen.",
    },
    engineUi: {
      gear: "Engine-Einstellungen", switchLabel: "Engine ein/aus", modeDepth: "Tiefe", modeTime: "Zeit", modeInfinite: "Unendlich", unitSeconds: "Sekunden",
      plus: "Erhöhen", minus: "Verringern", arrows: "Pfeile auf dem Brett", arrowAll: "Alle Linien", arrowBest: "Nur der beste Zug (Linie 1)",
      arrowOff: "Keine Pfeile", line: "Linie", colorNote: "Linie 3 und alle weiteren Linien verwenden die Farbe von Linie 3.",
      movesShown: "Halbzüge pro Linie", hash: "Arbeitsspeicher (Hash)", strength: "Engine-Stärke", reset: "Standard wiederherstellen",
      fit: "Alle Fenster passend anordnen", resizeRows: "Höhe der Fenster ändern", limitLabel: "Analysedauer",
    },
  },
  en: {
    explorer: {
      title: "My Analyses", newAnalysis: "New Analysis", search: "Search analyses…", manage: "Manage", empty: "No saved analyses yet.",
      guest: "Sign in to see your folders and saved analyses here.", login: "Sign in",
      resize: "Resize the file tree", leave: "There are unsaved changes. Switch anyway?", rootFiles: "No folder",
      moves: "moves",
    },
    notation: {
      title: "Notation", empty: "No moves yet.", resizeRight: "Resize the notation column",
      commentTitle: "Comment", commentBefore: "Text before move", commentAfter: "Text after move", commentPlaceholder: "Comment on the selected move…", commentStart: "Comment on the starting position", commentOf: "Comment on",
      symbolsMove: "Move symbol", symbolsPosition: "Position symbol", scoresheet: "Scoresheet", symbolsTab: "Symbols", promote: "Promote line", demote: "Demote line", makeMain: "Make main move", deleteMove: "Delete move",
      nags: {
        "1": "Good move (!)", "2": "Mistake (?)", "3": "Brilliant move (!!)", "4": "Blunder (??)", "5": "Interesting move (!?)", "6": "Dubious move (?!)", "7": "Only move (□)",
        "10": "Equal (=)", "13": "Unclear (∞)", "14": "White is slightly better (⩲)", "15": "Black is slightly better (⩱)", "16": "White is better (±)", "17": "Black is better (∓)",
        "18": "White is winning (+−)", "19": "Black is winning (−+)", "146": "Novelty (N)",
      },
    },
    tabs: { import: "Import", export: "Export", info: "Game Info", save: "Save", clocks: "Clock Usage" },
    boardShift: "Move the board sideways",
    clock: { hint: "Type the minutes left after each move into the boxes (75 or 5.5). Times you type are shown as whole minutes in the notation; the exact times of an imported game stay exact.", dontShow: "Do not show again", hideHint: "Hide this text", edit: "Edit time", empty: "–", alternatives: "Other move here – click to switch", hasComment: "Has a comment" },
    importTabs: { pgn: "PGN", fen: "FEN", pgnHint: "Paste a whole game (PGN) with moves, variations and comments.", fenHint: "Paste a single position (FEN) to start the analysis from it.", fenPlaceholder: "e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
    move: { handle: "Move window (drag, or use the arrow keys)", drop: "Drop here", newColumn: "New column" },
    export: { copyPgn: "Copy PGN", downloadPgn: "Download PGN", copyFen: "Copy FEN", copyMoves: "Copy moves", copied: "Copied." },
    info: { event: "Event", site: "Site", date: "Date", white: "White", black: "Black", result: "Result", note: "These details are stored in the PGN and exported with it.", newTag: "New tag", removeTag: "Remove tag", resultNone: "Unfinished" },
    engines: {
      window: "Engine", add: "Add engine window", remove: "Close window", maxReached: "No more windows possible.",
      proOnly: "Several engine windows are available for Pro accounts.", moreLater: "More engines will follow.",
    },
    engineUi: {
      gear: "Engine settings", switchLabel: "Engine on/off", modeDepth: "Depth", modeTime: "Time", modeInfinite: "Infinite", unitSeconds: "seconds",
      plus: "Increase", minus: "Decrease", arrows: "Arrows on the board", arrowAll: "All lines", arrowBest: "Best move only (line 1)",
      arrowOff: "No arrows", line: "Line", colorNote: "Line 3 and all further lines use the colour of line 3.",
      movesShown: "Half-moves per line", hash: "Memory (hash)", strength: "Engine strength", reset: "Restore defaults",
      fit: "Fit all windows to their content", resizeRows: "Change the height of the windows", limitLabel: "Analysis limit",
    },
  },
};
