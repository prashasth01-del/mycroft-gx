"use client"

import { useState } from "react"
import { PencilLine, CircleCheck, Lightbulb, ChartColumn, Globe, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMycroft } from "@/components/providers/mycroft-provider"

const fieldClass =
  "glass-soft w-full rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Head({ icon: Icon, title, id }: { icon: LucideIcon; title: string; id: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </div>
      <h2 id={id} className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
    </div>
  )
}

/* ---- Create Note ---- */
export function NoteComposer({ onClose }: { onClose: () => void }) {
  const { addNote } = useMycroft()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        addNote(title, body)
        onClose()
      }}
    >
      <Head icon={PencilLine} title="Create note" id="cmd-note" />
      <div className="flex flex-col gap-3">
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={fieldClass} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something…"
          rows={5}
          className={`${fieldClass} resize-none`}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
          Cancel
        </Button>
        <Button type="submit" className="accent-fill rounded-full border-0 shadow-sm hover:opacity-90">
          Save note
        </Button>
      </div>
    </form>
  )
}

/* ---- Add Task ---- */
export function TaskComposer({ onClose }: { onClose: () => void }) {
  const { addTask } = useMycroft()
  const [title, setTitle] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        addTask(title)
        onClose()
      }}
    >
      <Head icon={CircleCheck} title="Add task" id="cmd-task" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className={fieldClass}
      />
      <p className="mt-2 px-1 text-xs text-muted-foreground">Added to Today by default.</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
          Cancel
        </Button>
        <Button type="submit" className="accent-fill rounded-full border-0 shadow-sm hover:opacity-90">
          Add task
        </Button>
      </div>
    </form>
  )
}

/* ---- AI prompt surfaces: Brainstorm / Summarize / Research ---- */
const AI_CONFIG: Record<
  string,
  { icon: LucideIcon; title: string; placeholder: string; sample: string }
> = {
  brainstorm: {
    icon: Lightbulb,
    title: "Brainstorm",
    placeholder: "What should we explore?",
    sample:
      "Here are a few directions to consider:\n\n• Frame the problem as a constraint, not a goal.\n• Borrow a metaphor from an unrelated field.\n• Invert the assumption everyone shares.\n\nWant me to expand any of these?",
  },
  summarize: {
    icon: ChartColumn,
    title: "Summarize",
    placeholder: "Paste text or name a source to summarize…",
    sample:
      "Summary:\n\nThe material centers on three points — reliability, latency, and a calmer interface. Each is framed as a quarterly theme with a concrete owner and metric.",
  },
  research: {
    icon: Globe,
    title: "Research",
    placeholder: "What would you like me to look into?",
    sample:
      "I gathered 8 relevant sources and clustered them into 3 themes. The strongest signal points to ambient, glanceable interfaces reducing cognitive load. I can save this thread to Knowledge.",
  },
}

export function AiComposer({ surface, onClose }: { surface: string; onClose: () => void }) {
  const { runAssistant } = useMycroft()
  const config = AI_CONFIG[surface]
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!config) return null
  const Icon = config.icon

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setPending(true)
    setResponse(null)
    runAssistant()
    window.setTimeout(() => {
      setResponse(config.sample)
      setPending(false)
    }, 1200)
  }

  return (
    <form onSubmit={submit}>
      <Head icon={Icon} title={config.title} id={`cmd-${surface}`} />
      <textarea
        autoFocus
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent.isComposing || e.keyCode === 229)) {
            submit(e)
          }
        }}
        placeholder={config.placeholder}
        rows={3}
        className={`${fieldClass} resize-none`}
      />

      {(pending || response) && (
        <div className="mt-3 flex gap-2.5 rounded-2xl bg-[color-mix(in_srgb,var(--violet)_8%,transparent)] p-3.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-violet" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
            {pending ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                Thinking
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-violet"
                      style={{ animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </span>
              </span>
            ) : (
              <p className="whitespace-pre-line text-pretty">{response}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
          Close
        </Button>
        <Button
          type="submit"
          disabled={pending || !prompt.trim()}
          className="accent-fill rounded-full border-0 shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {config.title}
        </Button>
      </div>
    </form>
  )
}
