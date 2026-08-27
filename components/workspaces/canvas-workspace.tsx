"use client"

import { Sparkles, ExternalLink } from "lucide-react"
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
    <article className="glass-soft flex w-full flex-col gap-2 rounded-2xl p-6 md:p-8">
      {item.title ? (
        <h2 className="font-display mb-2 text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
          {item.title}
        </h2>
      ) : null}
      {item.body ? (
        <div className="max-w-[70ch]">
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

export function CanvasWorkspace() {
  const { workspaceItems } = useMycroft()

  return (
    <WorkspaceShell
      icon={Sparkles}
      title="Workspace"
      subtitle={
        workspaceItems.length === 0
          ? undefined
          : `${workspaceItems.length} ${workspaceItems.length === 1 ? "item" : "items"}`
      }
    >
      {workspaceItems.length === 0 ? (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center">
          <Sparkles className="size-6 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-muted-foreground">
            Nothing here yet — ask Mycroft to show you something, or generate an image, and it'll land here.
          </p>
        </div>
      ) : (
        // Single-column vertical stack, newest first -- a long answer reads
        // as one continuous document (the way Claude's own long responses
        // do), not chopped into side-by-side masonry cards that force
        // reading in short, disconnected bursts across columns.
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {workspaceItems.map((item) =>
            item.kind === "image" ? <ImageCard key={item.id} item={item} /> : <TextCard key={item.id} item={item} />,
          )}
        </div>
      )}
    </WorkspaceShell>
  )
}
