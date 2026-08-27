/**
 * Formatting helpers for the Notes gallery/editor (local_db.py's
 * created_at/updated_at columns and Markdown note bodies, see
 * tools/local_db.py and note-editor.tsx).
 */

/** local_db.py stores "YYYY-MM-DD HH:MM:SS" (SQLite's datetime('now',
 * 'localtime')) -- a space, not a "T", and no offset. Most engines parse
 * that loosely as local time, but this app only ever runs inside
 * Electron's bundled Chromium, so make the local-time intent explicit
 * instead of relying on that loose parsing. */
function parseSqliteLocal(datetime: string): Date {
  return new Date(datetime.replace(" ", "T"))
}

/** "Edited just now" / "Edited 5m ago" / "Edited Tuesday" / "Edited Aug 3" --
 * the Google Docs gallery's own relative-time convention. */
export function formatRelativeTime(datetime: string): string {
  const then = parseSqliteLocal(datetime)
  if (Number.isNaN(then.getTime())) return ""
  const diffMs = Date.now() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return then.toLocaleDateString([], { weekday: "long" })
  return then.toLocaleDateString([], { month: "short", day: "numeric" })
}

/** Strips Markdown syntax down to plain text for the gallery tile's preview
 * line -- decoration only, not a real parser. Order matters: images/links
 * before their bracket contents, then line-level markers. */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[\s>*-]*[-*+]\s+|^\s*\d+\.\s+/gm, "")
    .replace(/[*_~`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}
