"use client"

import { X, MapPin, Clock, Users, Video, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { longDateLabel, ACCENT_VAR } from "@/lib/calendar-utils"
import type { CalendarEvent } from "@/types"

export function EventDetail({
  event,
  onClose,
  onDelete,
}: {
  event: CalendarEvent
  onClose: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="animate-scale-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full"
            style={{ background: ACCENT_VAR[event.accent] }}
            aria-hidden
          />
          <div>
            <h3 className="text-balance text-lg font-semibold leading-tight text-foreground">
              {event.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{longDateLabel(event.date)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="state-layer relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        <Row icon={Clock}>
          {event.start} – {event.end}
        </Row>
        {event.location && <Row icon={MapPin}>{event.location}</Row>}
        {event.participants && event.participants.length > 0 && (
          <div className="flex items-start gap-2.5">
            <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <div className="flex flex-wrap gap-1.5">
              {event.participants.map((p) => (
                <span
                  key={p}
                  className="glass-soft rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </dl>

      {event.description && (
        <p className="text-pretty rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-3 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>
      )}

      <div className="mt-1 flex items-center gap-2">
        <Button className="accent-fill flex-1 gap-2 rounded-full border-0 shadow-sm hover:opacity-90">
          <Video className="size-4" strokeWidth={2} aria-hidden />
          Join meeting
        </Button>
        <button
          type="button"
          onClick={() => onDelete(event.id)}
          aria-label="Delete event"
          className={cn(
            "state-layer relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-[var(--burgundy)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function Row({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-foreground">
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      <span className="tabular-nums">{children}</span>
    </div>
  )
}
