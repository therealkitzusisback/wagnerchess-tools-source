// Opens the Account Settings window from anywhere on the website (the window lives in the header).
// section: which part to show (e.g. "analysis-room", "engine"); without it the part of the current page is chosen.
// anchor: id of an element inside that part to scroll to (e.g. "wc-keys").
export const OPEN_SETTINGS_EVENT = "wc-open-settings";
export type OpenSettingsDetail = { section?: string; anchor?: string };
export function openSettings(section?: string, anchor?: string) {
  window.dispatchEvent(new CustomEvent<OpenSettingsDetail>(OPEN_SETTINGS_EVENT, { detail: { section, anchor } }));
}
// The part of the Account Settings that belongs to a page.
export function sectionForPath(pathname: string): string | undefined {
  if (pathname.startsWith("/tools/analysisroom") || pathname.startsWith("/tools/library")) return "analysis-room";
  return undefined;
}
