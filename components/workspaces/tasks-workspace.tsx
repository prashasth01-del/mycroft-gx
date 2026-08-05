"use client"

import { useMemo, useState } from "react"
import { CircleCheck, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"
import type { Task, TaskBucket, TaskPriority } from "@/types"

const BUCKETS: { id: TaskBucket; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "someday", label: "Someday" },
]

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  high: "text-[var(--burgundy)] bg-[color-mix(in_srgb,var(--burgundy)_12%,transparent)]",
  medium: "text-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_16%,transparent)]",
  low: "text-muted-foreground bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]",
}

export function TasksWorkspace() {
  const { tasks, addTask, toggleTask } = useMycroft()
  const [draft, setDraft] = useState("")

  const grouped = useMemo(() => {
    const map: Record<TaskBucket, Task[]> = { today: [], upcoming: [], someday: [] }
    for (const t of tasks) map[t.bucket].push(t)
    return map
  }, [tasks])

  const remaining = tasks.filter((t) => !t.done).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addTask(draft)
    setDraft("")
  }

  return (
    <WorkspaceShell
      icon={CircleCheck}
      title="Tasks"
      subtitle={`${remaining} open · ${tasks.length - remaining} done`}
    >
      <form onSubmit={submit} className="mb-5 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
          }}
          placeholder="Add a task and press Enter…"
          className="glass-soft flex-1 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" className="accent-fill size-10 shrink-0 rounded-full border-0 p-0 shadow-sm hover:opacity-90">
          <Plus className="size-5" strokeWidth={2.25} aria-hidden />
          <span className="sr-only">Add task</span>
        </Button>
      </form>

      <div className="flex flex-col gap-6">
        {BUCKETS.map(({ id, label }) => {
          const list = grouped[id]
          if (list.length === 0) return null
          return (
            <div key={id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </h3>
                <span className="text-xs text-muted-foreground/70">{list.length}</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {list.map((task) => (
                  <li key={task.id}>
                    <div className="glass-soft group flex items-center gap-3 rounded-2xl p-3">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        aria-pressed={task.done}
                        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          task.done
                            ? "accent-fill border-transparent"
                            : "border-border bg-transparent hover:border-[var(--violet)]",
                        )}
                      >
                        {task.done && <Check className="size-3" strokeWidth={3} aria-hidden />}
                      </button>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          task.done ? "text-muted-foreground line-through" : "text-foreground",
                        )}
                      >
                        {task.title}
                      </span>
                      {task.due && !task.done && (
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {task.due}
                        </span>
                      )}
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          PRIORITY_STYLE[task.priority],
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </WorkspaceShell>
  )
}
