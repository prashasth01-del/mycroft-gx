"use client"

import { useMemo, useState } from "react"
import { FileText, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime, stripMarkdown } from "@/lib/note-utils"
import type { AccentKey, Note } from "@/types"

const ACCENT_BAR: Record<AccentKey, string> = {
  violet: "bg-[var(--violet)]",
  plum: "bg-[var(--plum)]",
  burgundy: "bg-[var(--burgundy)]",
  gold: "bg-[var(--gold)]",
}

export function NotesGallery({
  notes,
  onOpen,
  onNew,
}: {
  notes: Note[]
  onOpen: (id: string) => void
  onNew: () => void
}) {
  const [query, setQuery] = useState("")

  // Most-recently-edited first -- the Google Docs landing grid's own
  // default ordering.
  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.updated.localeCompare(a.updated)),
    [notes],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        stripMarkdown(note.body).toLowerCase().includes(q) ||
        note.tag.toLowerCase().includes(q),
    )
  }, [sorted, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="glass-soft flex items-center gap-2.5 rounded-full px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search notes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!query && (
          <button
            type="button"
            onClick={onNew}
            className="state-layer glass-soft relative flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-border p-5 text-muted-foreground transition-transform hover:-translate-y-px hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
              <Plus className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="text-sm font-medium">New note</span>
          </button>
        )}

        {query && filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No notes match &ldquo;{query}&rdquo;.
          </p>
        )}

        {filtered.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onOpen(note.id)}
            className="state-layer glass-soft relative flex min-h-[168px] flex-col overflow-hidden rounded-[24px] p-5 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("absolute inset-x-0 top-0 h-1", ACCENT_BAR[note.accent])} aria-hidden />
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <span className="truncate text-sm font-semibold text-foreground">{note.title}</span>
            </div>
            <p className="line-clamp-4 flex-1 text-pretty text-xs leading-relaxed text-muted-foreground">
              {stripMarkdown(note.body) || "Empty note"}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--violet)_12%,transparent)] px-2 py-0.5 text-[10px] font-medium text-violet">
                {note.tag}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                Edited {formatRelativeTime(note.updated)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
