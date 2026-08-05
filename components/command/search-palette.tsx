"use client"

import { useMemo, useState } from "react"
import {
  Search,
  CalendarDays,
  CircleCheck,
  FileText,
  CornerDownLeft,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { NavId } from "@/types"

interface Result {
  id: string
  label: string
  meta: string
  icon: typeof Search
  nav: NavId
}

export function SearchPalette({ onClose }: { onClose: () => void }) {
  const { events, tasks, notes, setActiveNav } = useMycroft()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    const all: Result[] = [
      ...events.map((e) => ({
        id: e.id,
        label: e.title,
        meta: `${e.start}${e.location ? ` · ${e.location}` : ""}`,
        icon: CalendarDays,
        nav: "calendar" as NavId,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        label: t.title,
        meta: t.done ? "Task · done" : "Task",
        icon: CircleCheck,
        nav: "tasks" as NavId,
      })),
      ...notes.map((n) => ({
        id: n.id,
        label: n.title,
        meta: `Note · ${n.tag}`,
        icon: FileText,
        nav: "notes" as NavId,
      })),
    ]
    if (!q) return all.slice(0, 6)
    return all.filter((r) => r.label.toLowerCase().includes(q) || r.meta.toLowerCase().includes(q)).slice(0, 8)
  }, [query, events, tasks, notes])

  function choose(r: Result) {
    setActiveNav(r.nav)
    onClose()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && !(e.nativeEvent.isComposing || e.keyCode === 229)) {
      e.preventDefault()
      const r = results[active]
      if (r) choose(r)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search events, tasks, notes…"
          className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search"
        />
        <kbd className="hidden items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
          ESC
        </kbd>
      </div>

      <ul className="flex max-h-[46vh] flex-col gap-1 overflow-y-auto scroll-quiet">
        {results.length === 0 && (
          <li className="px-2 py-8 text-center text-sm text-muted-foreground">
            No matches for &ldquo;{query}&rdquo;
          </li>
        )}
        {results.map((r, i) => {
          const Icon = r.icon
          return (
            <li key={`${r.nav}-${r.id}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  i === active ? "glass-soft" : "hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-muted-foreground">
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{r.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.meta}</span>
                </span>
                {i === active && (
                  <ArrowRight className="size-4 shrink-0 text-violet" strokeWidth={2} aria-hidden />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CornerDownLeft className="size-3" aria-hidden /> to open
        </span>
        <span>↑↓ to navigate</span>
      </div>
    </div>
  )
}
