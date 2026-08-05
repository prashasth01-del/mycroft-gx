"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toISODate } from "@/lib/mock-data"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface MonthGridProps {
  viewMonth: Date
  selectedISO: string | null
  eventDates: Set<string>
  onPrev: () => void
  onNext: () => void
  onSelect: (iso: string) => void
}

export function MonthGrid({
  viewMonth,
  selectedISO,
  eventDates,
  onPrev,
  onNext,
  onSelect,
}: MonthGridProps) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const start = new Date(year, month, 1 - firstDay)

  const cells = Array.from({ length: 42 }).map((_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return date
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <NavArrow label="Previous month" onClick={onPrev}>
            <ChevronLeft className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </NavArrow>
          <NavArrow label="Next month" onClick={onNext}>
            <ChevronRight className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </NavArrow>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const iso = toISODate(date)
          const inMonth = date.getMonth() === month
          const isSelected = selectedISO === iso
          const hasEvent = eventDates.has(iso)
          return (
            <button
              key={iso}
              type="button"
              aria-label={date.toDateString()}
              aria-current={isSelected ? "date" : undefined}
              onClick={() => onSelect(iso)}
              className={cn(
                "state-layer relative mx-auto flex size-9 flex-col items-center justify-center rounded-[13px] text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !inMonth && "text-muted-foreground/40",
                inMonth && !isSelected && "text-foreground",
                isSelected && "text-primary-foreground shadow-[0_8px_18px_-8px_var(--violet)]",
              )}
              style={
                isSelected
                  ? {
                      background:
                        "linear-gradient(135deg, var(--violet), color-mix(in srgb, var(--burgundy) 55%, var(--plum)))",
                    }
                  : undefined
              }
            >
              <span className="tabular-nums">{date.getDate()}</span>
              {hasEvent && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground/80" : "bg-violet",
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NavArrow({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="state-layer relative flex size-8 items-center justify-center rounded-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}
