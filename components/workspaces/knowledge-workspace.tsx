"use client"

import { useMemo } from "react"
import { BookOpen, Brain, FileStack, Bookmark } from "lucide-react"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"
import type { KnowledgeItem } from "@/types"

const GROUPS: { kind: KnowledgeItem["kind"]; label: string; icon: typeof Brain }[] = [
  { kind: "memory", label: "What Mycroft remembers", icon: Brain },
  { kind: "source", label: "Connected sources", icon: FileStack },
  { kind: "saved", label: "Saved for later", icon: Bookmark },
]

export function KnowledgeWorkspace() {
  const { knowledge } = useMycroft()

  const grouped = useMemo(() => {
    const map = new Map<KnowledgeItem["kind"], KnowledgeItem[]>()
    for (const item of knowledge) {
      const list = map.get(item.kind) ?? []
      list.push(item)
      map.set(item.kind, list)
    }
    return map
  }, [knowledge])

  return (
    <WorkspaceShell icon={BookOpen} title="Knowledge" subtitle="Memory, sources, and saved context">
      <div className="flex flex-col gap-6">
        {GROUPS.map(({ kind, label, icon: Icon }) => {
          const list = grouped.get(kind) ?? []
          if (list.length === 0) return null
          return (
            <section key={kind} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                <h3 className="text-xs font-semibold uppercase tracking-wider">{label}</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map((item) => (
                  <div
                    key={item.id}
                    className="glass-soft flex flex-col gap-1 rounded-2xl p-4"
                  >
                    <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </WorkspaceShell>
  )
}
