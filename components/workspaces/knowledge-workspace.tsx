"use client"

import { Brain, BookOpen, FileStack } from "lucide-react"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"

/** "2026-08-07T05:12:03.000000" (knowledge_store.py's ingested_at, or
 * local_db.py's created_at) -> "Aug 7". Defensive against an unparseable
 * or missing value (falls back to ""), since neither backend guarantees
 * one. */
function formatShortDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function KnowledgeWorkspace() {
  const { documents, facts } = useMycroft()

  return (
    <WorkspaceShell icon={BookOpen} title="Knowledge" subtitle="Sources and what Mycroft remembers">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileStack className="size-4" strokeWidth={1.75} aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Connected sources</h3>
          </div>
          {documents.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              No documents yet — drop files into your knowledge folder and they’ll show up here.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {documents.map((doc) => (
                <div key={doc.id} className="glass-soft flex flex-col gap-1 rounded-2xl p-4">
                  <p className="truncate text-sm font-medium leading-snug text-foreground">{doc.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.fileType.toUpperCase()} · {doc.chunkCount} {doc.chunkCount === 1 ? "chunk" : "chunks"}
                    {doc.ingestedAt ? ` · ${formatShortDate(doc.ingestedAt)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="size-4" strokeWidth={1.75} aria-hidden />
            <h3 className="text-xs font-semibold uppercase tracking-wider">What Mycroft remembers</h3>
          </div>
          {facts.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              Nothing saved yet — ask Mycroft to remember something and it’ll show up here.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.id} className="glass-soft flex flex-col gap-1 rounded-2xl p-4">
                  <p className="text-sm font-medium leading-snug text-foreground">{fact.content}</p>
                  {fact.createdAt ? (
                    <p className="text-xs text-muted-foreground">{formatShortDate(fact.createdAt)}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  )
}
