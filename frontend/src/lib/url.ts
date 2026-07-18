/**
 * Sanitize a user-supplied URL before using it as a link href.
 * Only http(s) and mailto are allowed; anything else (notably `javascript:`,
 * `data:`, `vbscript:` and other script-capable schemes) collapses to "#" so a
 * malicious profile link can't run script when clicked.
 */
export function safeExternalUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "#";
  const trimmed = url.trim();
  // Protocol-relative and absolute http(s) are fine.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  // Bare domain with no scheme -> assume https (common in user input).
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return "#";
}
