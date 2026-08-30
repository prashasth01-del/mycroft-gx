"use client"

import { useEffect, useState } from "react"
import { Sparkles, ExternalLink, LayoutGrid, ArrowLeft } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"
import type { WorkspaceItem } from "@/types"

function formatShortDate(iso: string): string {
  if (!iso) return ""
  // workspace_store.py's created_at is a naive "YYYY-MM-DD HH:MM:SS"
  // local-time string (SQLite's datetime('now','localtime')) -- Safari/
  // WebKit's Date parser (this is an Electron/Chromium app, but stay
  // defensive) wants a "T" separator, not a space.
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"))
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

// Real markdown rendering (tools/browser_search.py now asks the model for
// actual #/##/**/-/[]() markdown, not the shouting-caps pseudo-structure
// it defaulted to when this only ever rendered as plain text) -- element
// styling kept close to how a long Claude response reads: real heading
// hierarchy, comfortable body line-height, links that open via the system
// browser instead of navigating this Electron window away from the app.
const MARKDOWN_COMPONENTS: Components = {
  // Tables were not styled at all before, so a wide result (a Canvas course
  // listing with instructors is the case that surfaced it) rendered as
  // unstyled runs of text and looked truncated. Wrapped in its own
  // horizontal scroller so a wide table scrolls itself instead of forcing
  // the whole panel narrow.
  table: ({ children }) => (
    <div className="scroll-quiet my-4 w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[520px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[color-mix(in_srgb,var(--violet)_8%,transparent)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/60 px-3 py-2 align-top text-foreground">{children}</td>
  ),
  h1: ({ children }) => (
    <h1 className="font-display mb-3 mt-6 text-2xl font-semibold leading-snug tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display mb-2.5 mt-6 text-xl font-semibold leading-snug tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display mb-2 mt-5 text-lg font-semibold leading-snug tracking-tight text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="font-display mb-4 text-[15.5px] leading-[1.75] text-foreground/90 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1.5 marker:text-violet">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 marker:text-violet">{children}</ol>,
  li: ({ children }) => (
    <li className="font-display text-[15.5px] leading-[1.7] text-foreground/90">{children}</li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-violet/40 pl-4 text-foreground/70 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-5 border-t border-[var(--glass-border)]" />,
  code: ({ children }) => (
    <code className="rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-1.5 py-0.5 text-[13px]">
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <button
      type="button"
      onClick={() => href && window.hud?.openLink(href)}
      className="break-words text-violet underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
    >
      {children}
    </button>
  ),
}

function TextCard({ item }: { item: WorkspaceItem }) {
  return (
    <article className="flex w-full flex-col gap-2 p-1 md:p-2">
      {item.title ? (
        <h2 className="font-display mb-2 text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
          {item.title}
        </h2>
      ) : null}
      {item.body ? (
        // No max-w clamp. This used to be max-w-[70ch], which is a fine
        // measure for prose but wrong for what actually lands here --
        // wide markdown tables (a Canvas course listing with instructors)
        // were being squeezed and visually cut off. Tables scroll
        // horizontally on their own (see MARKDOWN_COMPONENTS' table
        // wrapper) rather than forcing the whole column narrow.
        <div className="w-full">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {item.body}
          </ReactMarkdown>
        </div>
      ) : null}
      {item.url ? (
        <button
          type="button"
          onClick={() => window.hud?.openLink(item.url!)}
          className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--violet)_12%,transparent)] px-3 py-1 text-xs text-violet hover:bg-[color-mix(in_srgb,var(--violet)_20%,transparent)]"
        >
          <ExternalLink className="size-3" strokeWidth={2} aria-hidden />
          {item.source || "Open source"}
        </button>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">{formatShortDate(item.createdAt)}</p>
    </article>
  )
}

function ImageCard({ item }: { item: WorkspaceItem }) {
  return (
    <article className="glass-soft flex w-full flex-col gap-2 overflow-hidden rounded-2xl p-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URIs
          (AI-generated images) and arbitrary external hosts (found
          images) both hit next/image's optimizer badly; a plain <img>
          is the right tool here, same call knowledge-workspace.tsx-style
          panels don't need to make since they never render images. */}
      <img
        src={item.imageUrl || "/placeholder.svg"}
        alt={item.caption || "Generated image"}
        className="max-h-[480px] w-full rounded-xl object-contain"
      />
      {item.caption ? <p className="px-1 text-sm text-muted-foreground">{item.caption}</p> : null}
      <p className="px-1 text-xs text-muted-foreground">{formatShortDate(item.createdAt)}</p>
    </article>
  )
}

/** Live automation status (Part 7's UI requirement: running/queued/done
 * visible on the dashboard, not backend state you have to read a log for).
 * Sits above the artifact feed rather than inside it -- these rows are
 * transient status that gets REPLACED wholesale on each push, while the
 * items below are permanent records; a finished task drops off this strip
 * and leaves one Workspace item behind. */
function AutomationStrip() {
  const { automationTasks } = useMycroft()
  if (!automationTasks || automationTasks.length === 0) return null

  const live = automationTasks.filter((t) => t.state === "running" || t.state === "queued")
  const recent = automationTasks.filter((t) => t.state !== "running" && t.state !== "queued").slice(-3)
  const shown = [...live, ...recent]
  if (shown.length === 0) return null

  const tone: Record<string, string> = {
    running: "text-violet",
    queued: "text-muted-foreground",
    done: "text-emerald-500",
    failed: "text-red-500",
    aborted: "text-amber-500",
  }

  return (
    <div className="glass-soft mb-4 rounded-[20px] border border-border p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-4 text-violet" strokeWidth={1.75} aria-hidden />
        <span className="text-sm font-semibold text-foreground">Automation</span>
        {live.length > 0 && (
          <span className="text-xs text-muted-foreground">{live.length} running</span>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {shown.map((t) => (
          <li key={t.id} className="flex items-start gap-3 text-sm">
            <span className={`w-16 shrink-0 font-medium ${tone[t.state] ?? "text-muted-foreground"}`}>
              {t.state}
            </span>
            <span className="min-w-0 flex-1 text-foreground">
              <span className="line-clamp-2">{t.task}</span>
              {t.detail ? (
                <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{t.detail}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{t.tier}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One tile in the gallery: enough to recognise a past result, not to read
 * it. Reading happens in the detail view, which gets the whole panel. */
function GalleryTile({
  item,
  active,
  onOpen,
}: {
  item: WorkspaceItem
  active: boolean
  onOpen: () => void
}) {
  const preview = (item.body || item.caption || "").replace(/[#*`|>-]/g, " ").trim()
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`glass-soft state-layer flex min-h-[132px] flex-col gap-1.5 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "border-violet" : "border-border"
      }`}
    >
      <span className="line-clamp-2 text-sm font-semibold text-foreground">
        {item.title || (item.kind === "image" ? "Image" : "Result")}
      </span>
      {item.kind === "image" && item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- see ImageCard
        <img src={item.imageUrl} alt="" className="h-16 w-full rounded-lg object-cover" />
      ) : (
        <span className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">{preview}</span>
      )}
      <span className="text-[11px] text-muted-foreground">{formatShortDate(item.createdAt)}</span>
    </button>
  )
}

export function CanvasWorkspace() {
  const { workspaceItems } = useMycroft()
  const [showGallery, setShowGallery] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Newest by default, and it FOLLOWS new arrivals -- but only while the
  // user hasn't picked something themselves, so a result landing mid-read
  // doesn't yank them off what they were looking at.
  const newestId = workspaceItems[0]?.id ?? null
  const selected =
    workspaceItems.find((i) => i.id === selectedId) ?? workspaceItems[0] ?? null

  useEffect(() => {
    if (selectedId === null) return
    if (!workspaceItems.some((i) => i.id === selectedId)) setSelectedId(null)
  }, [workspaceItems, selectedId])

  const count = workspaceItems.length

  return (
    <WorkspaceShell
      icon={Sparkles}
      title="Workspace"
      subtitle={
        count === 0
          ? undefined
          : showGallery
            ? `${count} ${count === 1 ? "result" : "results"}`
            : selected?.title || undefined
      }
      action={
        count > 1 ? (
          <button
            type="button"
            onClick={() => setShowGallery((v) => !v)}
            className="state-layer flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showGallery ? (
              <>
                <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
                Back to result
              </>
            ) : (
              <>
                <LayoutGrid className="size-3.5" strokeWidth={2} aria-hidden />
                All results ({count})
              </>
            )}
          </button>
        ) : undefined
      }
    >
      <AutomationStrip />
      {count === 0 ? (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center">
          <Sparkles className="size-6 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-muted-foreground">
            Nothing here yet — ask Mycroft to show you something, or generate an image, and it&apos;ll land here.
          </p>
        </div>
      ) : showGallery ? (
        // Gallery: previous results as tiles, newest first. Deliberately a
        // grid of small tiles rather than the old stacked full cards --
        // this view is for FINDING a past result, not reading one.
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaceItems.map((item) => (
            <GalleryTile
              key={item.id}
              item={item}
              active={item.id === selected?.id}
              onOpen={() => {
                setSelectedId(item.id)
                setShowGallery(false)
              }}
            />
          ))}
        </div>
      ) : (
        // Detail: ONE result using the whole panel.
        //
        // Replaces a single scrolling column of stacked cards, each clamped
        // to max-w-[70ch] inside a max-w-3xl parent. That double constraint
        // is what made a wide result (a Canvas course table) look cut off,
        // and it meant the newest answer was competing for space with every
        // older one. One result at a time, full width; the rest move to the
        // gallery behind the header button.
        <div className="flex w-full flex-col">
          {selected ? (
            selected.kind === "image" ? (
              <ImageCard item={selected} />
            ) : (
              <TextCard item={selected} />
            )
          ) : null}
          {selectedId && newestId && selectedId !== newestId ? (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mt-4 w-fit rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Jump to newest result
            </button>
          ) : null}
        </div>
      )}
    </WorkspaceShell>
  )
}
