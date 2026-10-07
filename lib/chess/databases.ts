// Databases of the Analysis Room. Which ones a visitor can open depends on the account:
// "free" = every signed-in account, "pro" = Pro and admin accounts. "ready" = can be opened now, "soon" = in preparation.
export type DatabaseId = "mine" | "openings" | "tablebase" | "masters" | "online" | "players" | "tournaments" | "books";
export type DatabaseInfo = { id: DatabaseId; level: "free" | "pro"; status: "ready" | "soon" };

export const DATABASES: DatabaseInfo[] = [
  { id: "mine", level: "free", status: "ready" },
  { id: "openings", level: "free", status: "ready" },
  { id: "tablebase", level: "free", status: "ready" },
  { id: "books", level: "free", status: "soon" },
  { id: "masters", level: "pro", status: "soon" },
  { id: "online", level: "pro", status: "soon" },
  { id: "players", level: "pro", status: "soon" },
  { id: "tournaments", level: "pro", status: "soon" },
];
