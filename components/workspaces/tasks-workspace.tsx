"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CircleCheck, Check, Plus, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { MONTHS_SHORT } from "@/lib/calendar-utils"
import { reminderStatus } from "@/lib/reminder-utils"
import { WorkspaceShell } from "./workspace-shell"
import type { Task, TaskBucket, TaskPriority } from "@/types"

/** "Aug 10" for a parseable ISO date/datetime string, or "" if it doesn't
 * parse -- same tolerance as reminder-utils.ts's formatDueTime/dueDateISO,
 * just a shorter label suited to a compact task-card row. */
function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

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
  const { tasks, addTask, toggleTask, handleTaskAction } = useMycroft()
  const [draft, setDraft] = useState("")
  const [dueDate, setDueDate] = useState("") // native input type=date value: "YYYY-MM-DD", or "" for none

  // "Let Mycroft handle this" per-task state -- keyed by task id, separate
  // from the task itself since this is UI-only affordance state, not
  // anything local_db.py stores. See mycroft-provider.tsx's
  // handleTaskAction docstring for why this never mutates the task on
  // success: it only starts a conversation, it doesn't complete anything.
  const [actionState, setActionState] = useState<Record<string, "pending" | "error">>({})
  const [actionError, setActionError] = useState<Record<string, string>>({})

  async function runTaskAction(task: Task) {
    setActionState((prev) => ({ ...prev, [task.id]: "pending" }))
    const result = await handleTaskAction(task)
    setActionState((prev) => {
      const next = { ...prev }
      if (result.ok) delete next[task.id]
      else next[task.id] = "error"
      return next
    })
    if (!result.ok) {
      setActionError((prev) => ({ ...prev, [task.id]: result.error || "Couldn't start a session." }))
    }
  }

  const grouped = useMemo(() => {
    const map: Record<TaskBucket, Task[]> = { today: [], upcoming: [], someday: [] }
    for (const t of tasks) map[t.bucket].push(t)
    return map
  }, [tasks])

  const remaining = tasks.filter((t) => !t.done).length

  function submit(e: React.FormEvent) {
    e.preventDefault()
    addTask(draft, dueDate || undefined)
    setDraft("")
    setDueDate("")
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
        {/* Date only, no time -- a task's due date is day-granularity (see
            addTask's docstring in mycroft-provider.tsx), unlike
            ReminderCreate's separate date+time pair for a specific
            due moment. */}
        <label className="relative shrink-0">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date (optional)"
            className="glass-soft w-[9.5rem] rounded-full py-2.5 pl-9 pr-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
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
                    <div className="glass-soft group flex flex-col gap-2 rounded-2xl p-3">
                      <div className="flex items-center gap-3">
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
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm",
                              task.done ? "text-muted-foreground line-through" : "text-foreground",
                            )}
                          >
                            {task.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>Created {shortDate(task.createdAt)}</span>
                            {task.due && (
                              <>
                                <span aria-hidden>·</span>
                                <span
                                  className={cn(
                                    !task.done &&
                                      reminderStatus(task.due) === "overdue" &&
                                      "font-medium text-[var(--burgundy)]",
                                  )}
                                >
                                  Due {shortDate(task.due)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                            PRIORITY_STYLE[task.priority],
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Session B: only when tool_categories classified this
                          task's text as matching a real action group -- no
                          affordance at all otherwise (see
                          mycroft-provider.tsx/tool_categories.py, "don't
                          force a guess"). Clicking this NEVER executes
                          anything directly -- it starts a normal
                          conversation session seeded with the task's text,
                          which then asks for confirmation out loud exactly
                          like a spoken request would (see
                          jarvis_conversation.py's seed_text handling and
                          tools/action_guard.py). */}
                      {task.actionableGroup && !task.done && (
                        <div className="pl-8">
                          <button
                            type="button"
                            onClick={() => runTaskAction(task)}
                            disabled={actionState[task.id] === "pending"}
                            className="state-layer relative inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--violet)_12%,transparent)] px-3 py-1 text-xs font-medium text-violet transition-opacity hover:opacity-90 disabled:opacity-60"
                          >
                            <Wand2 className="size-3.5" strokeWidth={2} aria-hidden />
                            {actionState[task.id] === "pending" ? "Starting…" : "Let Mycroft handle this"}
                          </button>
                          {actionState[task.id] === "error" && (
                            <p className="mt-1 text-[11px] text-[var(--burgundy)]">{actionError[task.id]}</p>
                          )}
                        </div>
                      )}
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
