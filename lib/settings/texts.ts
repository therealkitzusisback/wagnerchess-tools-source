import type { KeyAction } from "@/lib/chess/keybinds";

// Texts of all settings windows. English is the working language; German is switched off site-wide until it is enabled in the admin panel.
export type SettingsTexts = {
  close: string; plus: string; minus: string; on: string; off: string;
  account: { title: string; button: string; nav: string; groupChess: string; groupLook: string; backgroundTitle: string; noteSaved: string; noteLocal: string };
  room: {
    title: string; flip: string; flipHint: string; pieces: string; piecesHint: string; board: string; boardHint: string; evalBar: string; evalBarHint: string;
    evalNumber: string; evalNumberHint: string; coords: string; coordsHint: string; legal: string; legalHint: string;
    positions: string; positionsHint: string; positionsPro: string; positionsReset: string;
    windows: string; windowsHint: string; winExplorer: string; winNotation: string; winComment: string; databases: string; databasesHint: string; databasesSoon: string;
    clockTimes: string; clockTimesHint: string; figurines: string; figurinesHint: string; hintClock: string; hintClockHint: string; sheet: string; sheetHint: string; rail: string; railHint: string; wheel: string; wheelHint: string; wheelInvert: string; wheelInvertHint: string;
    keys: string; keysHint: string; keyAdd: string; keyPress: string; keyRemove: string; keyNone: string; keysReset: string; keysResetButton: string;
    actions: Record<KeyAction, string>;
  };
  engine: {
    title: string; showLines: string; showLinesHint: string; arrows: string; arrowsHint: string; arrowAll: string; arrowBest: string; arrowOff: string;
    line: string; colors: string; colorsHint: string; scoreUnit: string; scoreUnitHint: string; unitPawns: string; unitPercent: string;
    moves: string; movesHint: string; hash: string; hashHint: string; threads: string; threadsHint: string; threadsAuto: string; reload: string; needsReload: string;
    defaultEngine: string; defaultEngineHint: string; startOnLoad: string; startOnLoadHint: string; timeStep: string; timeStepHint: string; timer: string; timerHint: string; timerDown: string; timerUp: string; timerOff: string;
    notInstalled: string;
    reset: string; resetHint: string; resetButton: string; tip: string;
  };
  addEngine: { title: string; intro: string; notInstalled: string; cancel: string };
  dialogs: { newAnalysisTitle: string; openAnalysisTitle: string; ok: string; cancel: string };
  download: { title: string; intro: string; size: string; sizeUnknown: string; points: string[]; confirm: string; cancel: string };
};

export const settingsTexts: Record<"de" | "en", SettingsTexts> = {
  en: {
    close: "Close", plus: "Increase", minus: "Decrease", on: "On", off: "Off",
    account: {
      title: "Account Settings", button: "Settings", nav: "Settings topics", groupChess: "Chess Tools", groupLook: "Appearance", backgroundTitle: "Background",
      noteSaved: "These settings are saved in your account and apply on every device.",
      noteLocal: "You are not signed in: these settings are saved in this browser only. Sign in to keep them on every device.",
    },
    room: {
      title: "Analysis Room Settings",
      flip: "Flip board", flipHint: "Shows the board from Black's side.",
      pieces: "Pieces", piecesHint: "The piece set used on all boards of the website.",
      board: "Board", boardHint: "The board design used on all boards of the website.",
      evalBar: "Show evaluation bar", evalBarHint: "The bar next to the board. It needs a running engine.",
      evalNumber: "Show the number in the bar", evalNumberHint: "Turn it off to see only the bar.",
      coords: "Show coordinates", coordsHint: "The numbers 1-8 and letters A-H on the board.",
      legal: "Show legal squares", legalHint: "Clicking a piece marks the squares it can move to.",
      windows: "Visible Windows", windowsHint: "Switch off windows you do not use at the moment, so they do not take up space. The remaining windows grow to fill it.",
      positions: "Window Positions", positionsHint: "Pro and admin accounts can drag every window by its grip (⠿) into any column, above or below other windows, or onto the edge of the board or of the page to create a new column (up to four columns).", positionsPro: "Available with a Pro account.", positionsReset: "Restore positions",
      winExplorer: "My Analyses window", winNotation: "Notation window", winComment: "Comment window",
      databases: "Databases", databasesHint: "Choose which databases appear when you click the database symbol.",
      databasesSoon: "Coming later.",
      clockTimes: "Show clock times in the notation", clockTimesHint: "The remaining time after each move, to the right of the move (exact for imported games, whole minutes for times you typed in).",
      figurines: "Piece symbols in the notation", figurinesHint: "Moves are written with outlined chess piece symbols (♘f3). Off: with letters (Nf3). Applies to the scoresheet and the engine lines.",
      hintClock: "Show the help text in Clock Usage", hintClockHint: "The grey explanation above the times. You can also hide it there with “Do not show again”.",
      sheet: "Scoresheet as a table", sheetHint: "Moves in rows like on a paper scoresheet: number, White, Black. Off: the moves run on like text, with variations indented.",
      rail: "Toolbar at the left edge", railHint: "The narrow bar with files, databases, search and more. Hover over it to open it.",
      wheel: "Scroll on the board to step through moves", wheelHint: "Scrolling down moves forward, scrolling up moves back.",
      wheelInvert: "Reverse the scroll direction", wheelInvertHint: "Scrolling down moves back, scrolling up moves forward.",
      keys: "Keyboard Shortcuts", keysHint: "Click “+” and press the key (or key combination) you want. Esc cancels. One action can have several keys.",
      keyAdd: "Add a key", keyPress: "Press a key …", keyRemove: "Remove this key", keyNone: "No key", keysReset: "Restore shortcuts", keysResetButton: "Restore",
      actions: {
        back: "Previous move", forward: "Next move", first: "Jump to the first move", last: "Jump to the last move",
        prevBranch: "Previous variation", nextBranch: "Next variation", flip: "Flip board", toggleArrows: "Arrows on/off",
        toggleEngine: "Engine on/off", playBest: "Play the best engine move", toggleEvalBar: "Evaluation bar on/off", deleteMove: "Delete move", help: "Show keyboard shortcuts",
      },
    },
    engine: {
      title: "Engine Settings",
      showLines: "Show lines in the window", showLinesHint: "Off: the window shows only the evaluation, without moves.",
      arrows: "Arrows on the board", arrowsHint: "All lines, only the best move, or none.",
      arrowAll: "All lines", arrowBest: "Best move only", arrowOff: "No arrows",
      line: "Line", colors: "Arrow colours", colorsHint: "Line 3 and all further lines use the colour of line 3.",
      scoreUnit: "Show evaluation as", scoreUnitHint: "Pawns (+0.4) or White's winning chance (54%).",
      unitPawns: "Pawns", unitPercent: "Winning chance %",
      moves: "Half-moves per line", movesHint: "How long the lines in the window are.",
      hash: "Memory (hash)", hashHint: "More memory helps at great depth.",
      threads: "Processor cores", threadsHint: "How many cores the multi-threaded engine uses. More cores = faster analysis. Cores of this computer", threadsAuto: "Automatic", reload: "Reload page", needsReload: "The multi-threaded engine needs a fresh page load. Reload the page once, then switch the engine on.",
      defaultEngine: "Default engine", defaultEngineHint: "The engine of the first window when the page loads.",
      startOnLoad: "Start the default engine when a page opens", startOnLoadHint: "Off (default): you switch the engine on yourself.",
      timeStep: "Time step", timeStepHint: "Seconds added or removed by one click on + or − when the analysis is limited by time (longest time: 12 hours).",
      timer: "Clock for timed analysis", timerHint: "Engines that analyse for a set time can count the time down, count it up, or show no clock.",
      timerDown: "Count down", timerUp: "Count up", timerOff: "Off",
      notInstalled: "not installed",
      reset: "Restore defaults", resetHint: "Sets all engine settings back to the standard.", resetButton: "Restore",
      tip: "Tip: to use the evaluation bar without seeing any moves, switch off “Show lines in the window” and set the arrows to “No arrows”.",
    },
    addEngine: { title: "Add Engine", intro: "Which engine should the new window use?", notInstalled: "not installed on this site", cancel: "Cancel" },
    dialogs: { newAnalysisTitle: "New Analysis", openAnalysisTitle: "Open Analysis", ok: "OK", cancel: "Cancel" },
    download: {
      title: "Download Engine",
      intro: "This engine has to be downloaded to your browser before it can run.",
      size: "Download size",
      sizeUnknown: "a few megabytes up to over 100 MB",
      points: [
        "The download happens once. Your browser keeps the files, so later visits start at once.",
        "The engine then runs on your own computer. No positions are sent to a server.",
        "On a mobile connection the download may use a noticeable part of your data volume.",
        "Larger engines are stronger but need more memory and time to load.",
      ],
      confirm: "Download", cancel: "Cancel",
    },
  },
  de: {
    close: "Schließen", plus: "Erhöhen", minus: "Verringern", on: "An", off: "Aus",
    account: {
      title: "Kontoeinstellungen", button: "Einstellungen", nav: "Themen der Einstellungen", groupChess: "Schach-Tools", groupLook: "Darstellung", backgroundTitle: "Hintergrund",
      noteSaved: "Diese Einstellungen werden in Ihrem Konto gespeichert und gelten auf jedem Gerät.",
      noteLocal: "Sie sind nicht angemeldet: Diese Einstellungen werden nur in diesem Browser gespeichert. Melden Sie sich an, um sie auf jedem Gerät zu behalten.",
    },
    room: {
      title: "Analysis-Room-Einstellungen",
      flip: "Brett drehen", flipHint: "Zeigt das Brett aus Sicht von Schwarz.",
      pieces: "Figuren", piecesHint: "Der Figurensatz für alle Bretter der Website.",
      board: "Brett", boardHint: "Das Brettdesign für alle Bretter der Website.",
      evalBar: "Bewertungsbalken anzeigen", evalBarHint: "Der Balken neben dem Brett. Dafür muss eine Engine laufen.",
      evalNumber: "Zahl im Balken anzeigen", evalNumberHint: "Ausschalten, um nur den Balken zu sehen.",
      coords: "Koordinaten anzeigen", coordsHint: "Die Zahlen 1-8 und Buchstaben A-H am Brett.",
      legal: "Legale Felder anzeigen", legalHint: "Beim Anklicken einer Figur werden ihre möglichen Zielfelder markiert.",
      windows: "Sichtbare Fenster", windowsHint: "Schalten Sie Fenster aus, die Sie gerade nicht brauchen, damit sie keinen Platz verbrauchen. Die übrigen Fenster wachsen in den freien Platz.",
      positions: "Fensterpositionen", positionsHint: "Pro- und Admin-Konten können jedes Fenster am Griff (⠿) in jede Spalte ziehen, über oder unter andere Fenster oder an den Rand des Bretts bzw. der Seite, um eine neue Spalte anzulegen (bis zu vier Spalten).", positionsPro: "Mit einem Pro-Konto verfügbar.", positionsReset: "Positionen zurücksetzen",
      winExplorer: "Fenster „Meine Analysen“", winNotation: "Notationsfenster", winComment: "Kommentarfenster",
      databases: "Datenbanken", databasesHint: "Wählen Sie, welche Datenbanken beim Klick auf das Datenbank-Symbol erscheinen.",
      databasesSoon: "Folgt später.",
      clockTimes: "Bedenkzeiten in der Notation anzeigen", clockTimesHint: "Die Restzeit nach jedem Zug rechts neben dem Zug (genau bei importierten Partien, ganze Minuten bei selbst eingetragenen Zeiten).",
      figurines: "Figurensymbole in der Notation", figurinesHint: "Züge werden mit Schachfiguren-Symbolen (Umrisse) geschrieben (♘f3). Aus: mit Buchstaben (Sf3 bzw. Nf3). Gilt für das Scoresheet und die Engine-Zeilen.",
      hintClock: "Hilfetext in Clock Usage anzeigen", hintClockHint: "Der graue Erklärungstext über den Zeiten. Sie können ihn dort auch mit „Nicht mehr anzeigen“ ausblenden.",
      sheet: "Scoresheet als Tabelle", sheetHint: "Züge in Zeilen wie auf einem Papier-Partieformular: Nummer, Weiß, Schwarz. Aus: die Züge laufen wie Text weiter, Varianten eingerückt.",
      rail: "Leiste am linken Rand", railHint: "Die schmale Leiste mit Dateien, Datenbanken, Suche und mehr. Fahren Sie mit der Maus darüber, um sie zu öffnen.",
      wheel: "Mit dem Mausrad auf dem Brett Züge blättern", wheelHint: "Nach unten scrollen geht einen Zug vor, nach oben einen zurück.",
      wheelInvert: "Scrollrichtung umkehren", wheelInvertHint: "Nach unten scrollen geht zurück, nach oben vor.",
      keys: "Tastenkürzel", keysHint: "Klicken Sie auf „+“ und drücken Sie die gewünschte Taste (oder Tastenkombination). Esc bricht ab. Eine Aktion kann mehrere Tasten haben.",
      keyAdd: "Taste hinzufügen", keyPress: "Taste drücken …", keyRemove: "Diese Taste entfernen", keyNone: "Keine Taste", keysReset: "Tastenkürzel wiederherstellen", keysResetButton: "Zurücksetzen",
      actions: {
        back: "Voriger Zug", forward: "Nächster Zug", first: "Zum ersten Zug springen", last: "Zum letzten Zug springen",
        prevBranch: "Vorige Variante", nextBranch: "Nächste Variante", flip: "Brett drehen", toggleArrows: "Pfeile ein/aus",
        toggleEngine: "Engine ein/aus", playBest: "Besten Engine-Zug spielen", toggleEvalBar: "Bewertungsbalken ein/aus", deleteMove: "Zug löschen", help: "Tastenkürzel anzeigen",
      },
    },
    engine: {
      title: "Engine-Einstellungen",
      showLines: "Linien im Fenster anzeigen", showLinesHint: "Aus: Das Fenster zeigt nur die Bewertung, ohne Züge.",
      arrows: "Pfeile auf dem Brett", arrowsHint: "Alle Linien, nur der beste Zug oder keine.",
      arrowAll: "Alle Linien", arrowBest: "Nur der beste Zug", arrowOff: "Keine Pfeile",
      line: "Linie", colors: "Pfeilfarben", colorsHint: "Linie 3 und alle weiteren Linien verwenden die Farbe von Linie 3.",
      scoreUnit: "Bewertung anzeigen als", scoreUnitHint: "Bauerneinheiten (+0.4) oder Gewinnchance von Weiß (54 %).",
      unitPawns: "Bauerneinheiten", unitPercent: "Gewinnchance %",
      moves: "Halbzüge pro Linie", movesHint: "Wie lang die Linien im Fenster sind.",
      hash: "Arbeitsspeicher (Hash)", hashHint: "Mehr Speicher hilft bei großer Tiefe.",
      threads: "Prozessorkerne", threadsHint: "Wie viele Kerne die Multithread-Engine nutzt. Mehr Kerne = schnellere Analyse. Kerne dieses Computers", threadsAuto: "Automatisch", reload: "Seite neu laden", needsReload: "Die Multithread-Engine braucht ein frisches Laden der Seite. Laden Sie die Seite einmal neu und schalten Sie die Engine dann ein.",
      defaultEngine: "Standard-Engine", defaultEngineHint: "Die Engine des ersten Fensters, wenn die Seite lädt.",
      startOnLoad: "Standard-Engine beim Öffnen einer Seite starten", startOnLoadHint: "Aus (Standard): Sie schalten die Engine selbst ein.",
      timeStep: "Zeitschritt", timeStepHint: "Sekunden, die ein Klick auf + oder − im Zeit-Modus hinzufügt oder abzieht (längste Zeit: 12 Stunden).",
      timer: "Uhr bei zeitbegrenzter Analyse", timerHint: "Engines, die eine festgelegte Zeit lang analysieren, können die Zeit herunterzählen, hochzählen oder keine Uhr zeigen.",
      timerDown: "Herunterzählen", timerUp: "Hochzählen", timerOff: "Aus",
      notInstalled: "nicht installiert",
      reset: "Standard wiederherstellen", resetHint: "Setzt alle Engine-Einstellungen auf den Standard zurück.", resetButton: "Zurücksetzen",
      tip: "Tipp: Für den Bewertungsbalken ganz ohne Züge schalten Sie „Linien im Fenster anzeigen“ aus und die Pfeile auf „Keine Pfeile“.",
    },
    addEngine: { title: "Add Engine", intro: "Welche Engine soll das neue Fenster verwenden?", notInstalled: "auf dieser Website nicht installiert", cancel: "Abbrechen" },
    dialogs: { newAnalysisTitle: "New Analysis", openAnalysisTitle: "Open Analysis", ok: "OK", cancel: "Abbrechen" },
    download: {
      title: "Engine herunterladen",
      intro: "Diese Engine muss in Ihren Browser geladen werden, bevor sie laufen kann.",
      size: "Downloadgröße",
      sizeUnknown: "wenige Megabyte bis über 100 MB",
      points: [
        "Der Download geschieht nur einmal. Ihr Browser behält die Dateien, spätere Besuche starten sofort.",
        "Die Engine läuft danach auf Ihrem eigenen Computer. Es werden keine Stellungen an einen Server gesendet.",
        "Bei einer mobilen Verbindung kann der Download einen spürbaren Teil Ihres Datenvolumens verbrauchen.",
        "Größere Engines sind stärker, brauchen aber mehr Speicher und Ladezeit.",
      ],
      confirm: "Herunterladen", cancel: "Abbrechen",
    },
  },
};
