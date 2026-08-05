"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { longDateLabel } from "@/lib/calendar-utils"
import type { AccentKey, CalendarEvent } from "@/types"

const ACCENTS: AccentKey[] = ["violet", "plum", "burgundy", "gold"]
const ACCENT_VAR: Record<AccentKey, string> = {
  violet: "var(--violet)",
  plum: "var(--plum)",
  burgundy: "var(--burgundy)",
  gold: "var(--gold)",
}

const fieldClass =
  "glass-soft w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function EventCreate({
  dateISO,
  onClose,
  onCreate,
}: {
  dateISO: string
  onClose: () => void
  onCreate: (event: Omit<CalendarEvent, "id">) => void
}) {
  const [title, setTitle] = useState("")
  const [start, setStart] = useState("10:00 AM")
  const [end, setEnd] = useState("11:00 AM")
  const [location, setLocation] = useState("")
  const [accent, setAccent] = useState<AccentKey>("violet")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      date: dateISO,
      start,
      end,
      accent,
      location: location.trim() || undefined,
    })
    onClose()
  }

  return (
    <form onSubmit={submit} className="animate-scale-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">New event</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{longDateLabel(dateISO)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="state-layer relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the event?"
            className={fieldClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Start</span>
            <input value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">End</span>
            <input value={end} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Optional"
            className={fieldClass}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Color</span>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAccent(a)}
                aria-label={`${a} color`}
                aria-pressed={accent === a}
                style={{ background: ACCENT_VAR[a] }}
                className={cn(
                  "size-7 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  accent === a ? "scale-110 ring-2 ring-offset-2 ring-offset-transparent ring-white/70" : "opacity-70 hover:opacity-100",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button type="submit" className="accent-fill flex-1 rounded-full border-0 shadow-sm hover:opacity-90">
          Create event
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
          Cancel
        </Button>
      </div>
    </form>
  )
}
