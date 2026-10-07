// Texts of the file manager (/tools/library).
export type LibraryUiTexts = {
  search: string; newAnalysis: string; newFolder: string; newSubfolder: string; expandAll: string; collapseAll: string;
  open: string; rename: string; moveTo: string; delete: string; more: string; mainFolder: string; items: string;
  hint: string; empty: string; cancel: string; ok: string;
  renameTitle: string; newFolderTitle: string; nameLabel: string; moveTitle: string; moveHere: string; currentPlace: string;
  deleteFile: string; deleteFolder: string; deleteHint: string;
  exportAction: string; exportAll: string; exportTitle: string; exportZip: string; exportZipHint: string; exportPgn: string; exportPgnHint: string; exportNothing: string; exportDone: string; exportError: string; exportScope: string;
  moved: string; renamed: string; deleted: string; created: string; changed: string;
};

export const libraryUiTexts: Record<"de" | "en", LibraryUiTexts> = {
  de: {
    search: "Analysen suchen …", newAnalysis: "Neue Analyse", newFolder: "Neuer Ordner", newSubfolder: "Neuer Unterordner", expandAll: "Alle aufklappen",
    collapseAll: "Alle zuklappen", open: "Öffnen", rename: "Umbenennen", moveTo: "Verschieben nach …", delete: "Löschen",
    more: "Weitere Aktionen", mainFolder: "Hauptordner", items: "Einträge",
    hint: "Tipp: Dateien und Ordner lassen sich mit der Maus auf einen Ordner ziehen. Rechtsklick oder „⋯“ öffnet das Menü.",
    empty: "Noch nichts gespeichert. Legen Sie einen Ordner an oder speichern Sie eine Analyse im Analysis Room.",
    cancel: "Abbrechen", ok: "OK",
    renameTitle: "Umbenennen", newFolderTitle: "Neuer Ordner", nameLabel: "Name", moveTitle: "Verschieben nach", moveHere: "Hierher verschieben",
    currentPlace: "(aktueller Ort)",
    deleteFile: "Analyse „{name}“ endgültig löschen?",
    deleteFolder: "Ordner „{name}“ mit allen Unterordnern und Analysen darin endgültig löschen?",
    deleteHint: "Das lässt sich nicht rückgängig machen.",
    exportAction: "Exportieren …", exportAll: "Alles exportieren", exportTitle: "Exportieren", exportScope: "Enthalten sind: {n} Analysen aus „{name}“ und allen Unterordnern.",
    exportZip: "ZIP-Datei mit Ordnerstruktur", exportZipHint: "Eine Datei, in der jede Analyse als eigene PGN-Datei in ihrem Ordner liegt.",
    exportPgn: "Eine einzige PGN-Datei", exportPgnHint: "Alle Analysen hintereinander in einer Datei, ohne Ordner.",
    exportNothing: "Hier gibt es noch keine Analysen zum Exportieren.", exportDone: "Download gestartet.", exportError: "Der Export hat nicht geklappt. Bitte versuchen Sie es noch einmal.",
    moved: "Verschoben.", renamed: "Umbenannt.", deleted: "Gelöscht.", created: "Ordner angelegt.", changed: "Geändert",
  },
  en: {
    search: "Search analyses…", newAnalysis: "New Analysis", newFolder: "New folder", newSubfolder: "New subfolder", expandAll: "Expand all",
    collapseAll: "Collapse all", open: "Open", rename: "Rename", moveTo: "Move to …", delete: "Delete",
    more: "More actions", mainFolder: "Main folder", items: "items",
    hint: "Tip: drag files and folders onto a folder with the mouse. Right-click or “⋯” opens the menu.",
    empty: "Nothing saved yet. Create a folder or save an analysis in the Analysis Room.",
    cancel: "Cancel", ok: "OK",
    renameTitle: "Rename", newFolderTitle: "New Folder", nameLabel: "Name", moveTitle: "Move to", moveHere: "Move here",
    currentPlace: "(current place)",
    deleteFile: "Delete the analysis “{name}” permanently?",
    deleteFolder: "Delete the folder “{name}” with all subfolders and analyses in it permanently?",
    deleteHint: "This cannot be undone.",
    exportAction: "Export …", exportAll: "Export everything", exportTitle: "Export", exportScope: "Included: {n} analyses from “{name}” and all subfolders.",
    exportZip: "ZIP file with folder structure", exportZipHint: "One file in which every analysis is its own PGN file inside its folder.",
    exportPgn: "A single PGN file", exportPgnHint: "All analyses one after another in one file, without folders.",
    exportNothing: "There are no analyses to export here yet.", exportDone: "Download started.", exportError: "The export did not work. Please try again.",
    moved: "Moved.", renamed: "Renamed.", deleted: "Deleted.", created: "Folder created.", changed: "Changed",
  },
};
