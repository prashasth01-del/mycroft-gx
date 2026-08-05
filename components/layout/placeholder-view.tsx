"use client"

import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  FileText,
  Settings,
  Smartphone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NavId } from "@/types"

const VIEW_META: Partial<Record<NavId, { title: string; blurb: string; icon: LucideIcon }>> = {
  tasks: {
    title: "Tasks",
    blurb: "Everything on your plate, prioritized by Mycroft and ready to action.",
    icon: CircleCheck,
  },
  calendar: {
    title: "Calendar",
    blurb: "Your full schedule, meetings and focus blocks in one calm view.",
    icon: CalendarDays,
  },
  notes: {
    title: "Notes",
    blurb: "Captured thoughts, summaries and drafts, organized automatically.",
    icon: FileText,
  },
  knowledge: {
    title: "Knowledge",
    blurb: "A connected memory of documents, references and learned context.",
    icon: BookOpen,
  },
  devices: {
    title: "Devices",
    blurb: "Manage the surfaces where Mycroft listens, speaks and assists.",
    icon: Smartphone,
  },
  settings: {
    title: "Settings",
    blurb: "Tune Mycroft's voice, privacy, integrations and appearance.",
    icon: Settings,
  },
}

export function PlaceholderView({ nav }: { nav: NavId }) {
  const meta = VIEW_META[nav]
  if (!meta) return null
  const { title, blurb, icon: Icon } = meta

  return (
    <section className="glass relative flex flex-1 flex-col items-center justify-center gap-5 rounded-[30px] px-8 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-[20px] glass-soft text-violet">
        <Icon className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="max-w-sm">
        <h2 className="text-2xl font-medium tracking-tight text-foreground text-balance">
          {title}
        </h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </p>
      </div>
      <span className="rounded-full glass-soft px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
        Coming online
      </span>
    </section>
  )
}
