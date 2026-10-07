export type ChessTexts = {
  board: {
    flip: string; start: string; back: string; forward: string; end: string; newGame: string; deleteMove: string;
    check: string; mate: string; stalemate: string; draw: string; whiteToMove: string; blackToMove: string;
    promoteTitle: string; pieces: string; boardTheme: string; resizeBoard: string; confirmNew: string; leaveWarning: string; piecesMissing: string;
  };
  engine: {
    title: string; on: string; off: string; loading: string; ready: string; unavailable: string; notInstalled: string;
    lines: string; depth: string; unlimited: string; strength: string; lite: string; full: string; depthLabel: string;
    waiting: string; noLines: string; localNote: string; fellBack: string;
  };
  moves: { title: string; empty: string };
  tools: {
    title: string; importLabel: string; importButton: string; importError: string; copyPgn: string; downloadPgn: string;
    copyFen: string; copied: string; imported: string; importEmpty: string;
  };
  save: {
    title: string; guest: string; login: string; titleLabel: string; folderLabel: string; root: string; save: string;
    update: string; saveCopy: string; saved: string; error: string; library: string; defaultTitle: string; noMoves: string;
  };
};

export type LibraryTexts = {
  title: string; lead: string; root: string; newFolder: string; folderName: string; create: string; folders: string;
  files: string; emptyFolder: string; open: string; rename: string; move: string; delete: string; confirmDelete: string;
  confirmDeleteFolder: string; save: string; moveTo: string; updated: string; startAnalysis: string; path: string;
  errors: Record<string, string>; ok: Record<string, string>;
};

export const chessTexts: Record<"de" | "en", ChessTexts> = {
  de: {
    board: {
      flip: "Brett drehen", start: "Anfang", back: "Zurück", forward: "Weiter", end: "Ende", newGame: "Neue Analyse",
      deleteMove: "Zug löschen", check: "Schach", mate: "Schachmatt", stalemate: "Patt", draw: "Remis",
      whiteToMove: "Weiß ist am Zug", blackToMove: "Schwarz ist am Zug", promoteTitle: "Umwandeln in", pieces: "Figuren", boardTheme: "Brett", resizeBoard: "Brettgröße ändern",
      confirmNew: "Die aktuelle Analyse ist nicht gespeichert. Trotzdem neu beginnen?",
      leaveWarning: "Ihre Analyse ist nicht gespeichert.",
      piecesMissing: "Hinweis für Admins: Das Figuren-Set konnte nicht geladen werden.",
    },
    engine: {
      title: "Engine", on: "Engine ein", off: "Engine aus", loading: "Engine wird geladen …", ready: "Bereit",
      unavailable: "Die Engine konnte nicht gestartet werden.", notInstalled: "Die Engine ist auf dieser Seite noch nicht installiert.",
      lines: "Varianten", depth: "Tiefe", unlimited: "unbegrenzt", strength: "Engine-Stärke",
      lite: "Lite (schnell, ca. 7 MB)", full: "Voll (stärkste Analyse, großer Download)", depthLabel: "Tiefe",
      waiting: "Analysiert …", noLines: "Keine Züge möglich.",
      localNote: "Die Engine läuft in Ihrem Browser. Es werden keine Stellungen an einen Server gesendet.",
      fellBack: "Multithread war hier nicht möglich. Die Engine läuft mit einem Kern.",
    },
    moves: { title: "Züge", empty: "Ziehen Sie eine Figur auf dem Brett, um zu beginnen." },
    tools: {
      title: "Import und Export", importLabel: "PGN oder FEN einfügen", importButton: "Laden",
      importError: "Dieser Text konnte nicht gelesen werden. Bitte prüfen Sie das PGN oder die FEN.",
      copyPgn: "PGN kopieren", downloadPgn: "PGN herunterladen", copyFen: "FEN kopieren", copied: "Kopiert.", imported: "Geladen. Anzahl Züge", importEmpty: "Bitte fügen Sie zuerst ein PGN oder eine FEN in das Feld ein.",
    },
    save: {
      title: "Speichern", guest: "Als Gast wird Ihre Arbeit nicht gespeichert. Mit einem kostenlosen Konto speichern Sie Analysen in Ihren eigenen Ordnern. Den Export als PGN können Sie jederzeit nutzen.",
      login: "Anmelden", titleLabel: "Titel", folderLabel: "Ordner", root: "Hauptordner", save: "Speichern", update: "Aktualisieren",
      saveCopy: "Als neue Analyse speichern", saved: "Gespeichert.", error: "Das Speichern ist fehlgeschlagen.",
      library: "Meine Analysen ansehen", defaultTitle: "Analyse", noMoves: "Es gibt noch nichts zu speichern.",
    },
  },
  en: {
    board: {
      flip: "Flip Board", start: "Start", back: "Back", forward: "Forward", end: "End", newGame: "New Analysis",
      deleteMove: "Delete move", check: "Check", mate: "Checkmate", stalemate: "Stalemate", draw: "Draw",
      whiteToMove: "White to move", blackToMove: "Black to move", promoteTitle: "Promote to", pieces: "Pieces", boardTheme: "Board", resizeBoard: "Resize board",
      confirmNew: "The current analysis is not saved. Start a new one anyway?",
      leaveWarning: "Your analysis is not saved.",
      piecesMissing: "Note for admins: the piece set could not be loaded.",
    },
    engine: {
      title: "Engine", on: "Engine on", off: "Engine off", loading: "Loading engine …", ready: "Ready",
      unavailable: "The engine could not be started.", notInstalled: "The engine is not installed on this site yet.",
      lines: "Lines", depth: "Depth", unlimited: "unlimited", strength: "Engine strength",
      lite: "Lite (fast, about 7 MB)", full: "Full (strongest analysis, large download)", depthLabel: "Depth",
      waiting: "Analysing …", noLines: "No moves possible.",
      localNote: "The engine runs in your browser. No positions are sent to a server.",
      fellBack: "Multi-thread was not possible here. The engine runs on one core.",
    },
    moves: { title: "Moves", empty: "Move a piece on the board to begin." },
    tools: {
      title: "Import and Export", importLabel: "Paste PGN or FEN", importButton: "Load",
      importError: "This text could not be read. Please check the PGN or FEN.",
      copyPgn: "Copy PGN", downloadPgn: "Download PGN", copyFen: "Copy FEN", copied: "Copied.", imported: "Loaded. Number of moves", importEmpty: "Please paste a PGN or FEN into the box first.",
    },
    save: {
      title: "Save", guest: "As a guest your work is not saved. With a free account you save analyses in your own folders. PGN export is always available.",
      login: "Log in", titleLabel: "Title", folderLabel: "Folder", root: "Main folder", save: "Save", update: "Update",
      saveCopy: "Save as new analysis", saved: "Saved.", error: "Saving failed.",
      library: "View my analyses", defaultTitle: "Analysis", noMoves: "There is nothing to save yet.",
    },
  },
};

export const libraryTexts: Record<"de" | "en", LibraryTexts> = {
  de: {
    title: "Meine Analysen", lead: "Ihre gespeicherten Analysen, geordnet in Ordnern.", root: "Hauptordner", newFolder: "Neuer Ordner",
    folderName: "Name des Ordners", create: "Anlegen", folders: "Ordner", files: "Analysen", emptyFolder: "Dieser Ordner ist leer.",
    open: "Öffnen", rename: "Umbenennen", move: "Verschieben", delete: "Löschen", confirmDelete: "Ja, diese Analyse endgültig löschen.",
    confirmDeleteFolder: "Ja, diesen Ordner mit allen Unterordnern und Analysen darin endgültig löschen.", save: "Speichern",
    moveTo: "Verschieben nach", updated: "Geändert", startAnalysis: "Neue Analyse beginnen", path: "Pfad",
    errors: {
      name: "Bitte geben Sie einen Namen mit höchstens 80 Zeichen ein.", title: "Bitte geben Sie einen Titel mit höchstens 120 Zeichen ein.",
      depth: "Ordner können höchstens 6 Ebenen tief verschachtelt werden.", limit: "Das Limit für Ordner oder Analysen ist erreicht.",
      confirm: "Bitte bestätigen Sie das Löschen mit dem Häkchen.", invalid: "Ungültige Eingabe.", generic: "Das hat nicht funktioniert. Bitte versuchen Sie es erneut.",
    },
    ok: { folder: "Ordner angelegt.", renamed: "Umbenannt.", moved: "Verschoben.", deleted: "Gelöscht." },
  },
  en: {
    title: "My Analyses", lead: "Your saved analyses, organised in folders.", root: "Main folder", newFolder: "New folder",
    folderName: "Folder name", create: "Create", folders: "Folders", files: "Analyses", emptyFolder: "This folder is empty.",
    open: "Open", rename: "Rename", move: "Move", delete: "Delete", confirmDelete: "Yes, delete this analysis permanently.",
    confirmDeleteFolder: "Yes, delete this folder with all subfolders and analyses in it permanently.", save: "Save",
    moveTo: "Move to", updated: "Changed", startAnalysis: "Start new analysis", path: "Path",
    errors: {
      name: "Please enter a name of at most 80 characters.", title: "Please enter a title of at most 120 characters.",
      depth: "Folders can be nested at most 6 levels deep.", limit: "The limit for folders or analyses has been reached.",
      confirm: "Please confirm the deletion with the tick box.", invalid: "Invalid input.", generic: "That did not work. Please try again.",
    },
    ok: { folder: "Folder created.", renamed: "Renamed.", moved: "Moved.", deleted: "Deleted." },
  },
};
