"use client"

import { useEffect, useRef, useState } from "react"
import {
  BookOpen,
  Check,
  Clipboard,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { extractDocumentFilename } from "@/lib/chat-utils"
import { getDocumentText, pickAndAttachFile } from "@/lib/dashboard-bridge"
import type { ChatMessage } from "@/types"

interface Attachment {
  filename: string
  // No "attaching"/pending status -- pickAndAttachFile's returned Promise
  // only resolves once main.js's fs.copyFileSync has already finished, so
  // by the time attachFile() gets a result the file is already on disk;
  // there's no real intermediate state to show.
  status: "ready" | "error"
  error?: string
}

/** Same three-dot bounce used for the AI composer surfaces' "Thinking"
 * state (components/command/composer-surfaces.tsx) -- reused verbatim so
 * chat's loading state reads as the same visual language, not a new one. */
function ThinkingDots() {
  return (
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
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const { setActiveNav } = useMycroft()
  const isUser = message.role === "user"
  const showThinking = !isUser && message.pending && message.content === ""
  // Only once the reply has actually finished streaming, AND only when
  // this message isn't itself still asking for confirmation -- confirmed
  // live (2026-08-10): generate_document's pre-confirmation ask already
  // names the filename ("I'll create X.txt... Shall I go ahead?"), so
  // without the awaitingConfirmation exclusion this chip appeared before
  // the file existed, pointing the user at Knowledge with nothing there
  // yet. A real "it's done" reply doesn't ask a permission question, so
  // it never sets awaitingConfirmation -- this is the same heuristic
  // boundary as ConfirmationChips, just the complement of it.
  const docFilename =
    !message.pending && !isUser && !message.awaitingConfirmation
      ? extractDocumentFilename(message.content)
      : null

  return (
    <div className={cn("flex w-full gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
        </div>
      )}

      <div className={cn("flex max-w-[75%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "accent-fill text-primary-foreground"
              : message.error
                ? "bg-[color-mix(in_srgb,var(--burgundy)_10%,transparent)] text-[var(--burgundy)]"
                : "glass-soft text-foreground",
          )}
        >
          {showThinking ? (
            <ThinkingDots />
          ) : (
            <p className="whitespace-pre-wrap text-pretty">
              {message.content}
              {message.pending && (
                <span aria-hidden className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle" />
              )}
            </p>
          )}
        </div>

        {docFilename && (
          <button
            type="button"
            onClick={() => setActiveNav("knowledge")}
            className="state-layer relative inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--violet)_12%,transparent)] px-3 py-1 text-xs font-medium text-violet transition-opacity hover:opacity-90"
          >
            <BookOpen className="size-3.5" strokeWidth={2} aria-hidden />
            Open “{docFilename}” in Knowledge
          </button>
        )}
      </div>
    </div>
  )
}

/** Item 4's inline Confirm/Cancel -- an accelerator over typing a reply,
 * not the only way to confirm: confirm_pending_action is always in
 * CORE_TOOLS (phase5-conversation/jarvis_conversation.py), so typing
 * "yes, send it" works identically whether or not this heuristic fired.
 * See lib/chat-utils.ts's looksLikeConfirmationRequest docstring -- the
 * backend has no structured confirmation event, so a missed detection
 * here is a missing shortcut, not a broken confirmation flow. */
function ConfirmationChips({ onRespond }: { onRespond: (text: string) => void }) {
  return (
    <div className="ml-[42px] flex items-center gap-2">
      <button
        type="button"
        onClick={() => onRespond("Yes, please go ahead.")}
        className="state-layer relative inline-flex items-center gap-1.5 rounded-full accent-fill px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
        Confirm
      </button>
      <button
        type="button"
        onClick={() => onRespond("No, cancel that.")}
        className="state-layer relative inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" strokeWidth={2.5} aria-hidden />
        Cancel
      </button>
    </div>
  )
}

/** A file staged for the NEXT message, not yet sent -- attaching drops it
 * straight into the Knowledge folder-watch pipeline (main.js's
 * "pick-and-attach-file", copies into the same folder
 * knowledge_store.py's watchdog observer already watches), so the file is
 * durably saved and searchable immediately, independent of whether this
 * chip is ever actually sent with a message. "Copy text" works right away
 * too (getDocumentText re-extracts from the file on disk, no dependency
 * on chroma embedding having finished) -- only chat's ability to
 * semantically RECALL the file's content depends on that indexing lag,
 * which this chip doesn't block on or show status for. */
function AttachmentChip({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)

  async function copyText() {
    if (attachment.status !== "ready" || copying) return
    setCopying(true)
    const result = await getDocumentText(attachment.filename)
    setCopying(false)
    if (result.ok && result.text) {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="state-layer relative flex items-center gap-2 rounded-full glass-soft py-1.5 pl-3 pr-2 text-xs">
      <FileText
        className={cn("size-3.5 shrink-0", attachment.status === "error" ? "text-[var(--burgundy)]" : "text-violet")}
        strokeWidth={1.75}
        aria-hidden
      />
      {attachment.status === "error" ? (
        <span className="max-w-[220px] truncate text-[var(--burgundy)]">{attachment.error || "Attach failed"}</span>
      ) : (
        <span className="max-w-[160px] truncate text-foreground">{attachment.filename}</span>
      )}
      {attachment.status === "ready" && (
        <button
          type="button"
          onClick={copyText}
          disabled={copying}
          aria-label={`Copy text from ${attachment.filename}`}
          title="Copy extracted text"
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-violet disabled:opacity-50"
        >
          {copied ? (
            <ClipboardCheck className="size-3.5 text-violet" strokeWidth={2} aria-hidden />
          ) : (
            <Clipboard className="size-3.5" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${attachment.filename}`}
        title="Remove from this message (stays saved in Knowledge)"
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

export function ChatWorkspace() {
  const { chatMessages, chatPending, sendChat } = useMycroft()
  const [draft, setDraft] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chatMessages])

  async function attachFile() {
    const picked = await pickAndAttachFile()
    if (!picked.ok || !picked.filename) {
      // User cancelled the native file picker -- not an error, nothing to show.
      if (picked.error === "canceled") return
      // A real failure (disk full, permission denied, etc) -- shown as a
      // dismissable chip rather than a silent console warning, since the
      // user has no other way to find out the attach didn't work.
      const errorId = `error-${Date.now()}`
      setAttachments((prev) => [
        ...prev,
        { filename: errorId, status: "error", error: picked.error || "Attach failed" },
      ])
      return
    }
    const filename = picked.filename
    setAttachments((prev) =>
      prev.some((a) => a.filename === filename) ? prev : [...prev, { filename, status: "ready" }],
    )
  }

  function removeAttachment(filename: string) {
    setAttachments((prev) => prev.filter((a) => a.filename !== filename))
  }

  function submit() {
    const clean = draft.trim()
    if (!clean || chatPending) return
    // Names each attachment explicitly in the message text -- RAG's
    // retrieve_relevant (tools/text_chat.py) is semantic search over the
    // "documents" collection, not filename-aware, so without this the
    // model has no reliable way to know THIS message is about the file
    // just attached versus something already in Knowledge from before.
    // Only "ready" ones -- an "error" chip is a failed-attach notice, not
    // a real file, and shouldn't be claimed as one to the model.
    const ready = attachments.filter((a) => a.status === "ready")
    const attachmentNote =
      ready.length > 0 ? `[Attached: ${ready.map((a) => `"${a.filename}"`).join(", ")}] ` : ""
    sendChat(attachmentNote + clean)
    setDraft("")
    setAttachments([])
  }

  const lastMessage = chatMessages[chatMessages.length - 1]
  const showConfirmationChips = !!lastMessage && !lastMessage.pending && lastMessage.awaitingConfirmation

  return (
    <section className="glass glass-dense flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] p-5 md:p-6">
      <header className="flex items-center gap-3 pb-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
          <MessageSquare className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Chat</h2>
          <p className="text-xs text-muted-foreground">
            A second way to talk to Mycroft — shares memory with voice
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="scroll-quiet min-h-0 flex-1 overflow-y-auto pr-1">
        {chatMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet — type below to start a text conversation with Mycroft.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chatMessages.map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
            {showConfirmationChips && <ConfirmationChips onRespond={sendChat} />}
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <AttachmentChip key={a.filename} attachment={a} onRemove={() => removeAttachment(a.filename)} />
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          "glass-soft flex items-end gap-2 rounded-[26px] p-2.5",
          attachments.length > 0 ? "mt-2" : "mt-4",
        )}
      >
        <button
          type="button"
          onClick={attachFile}
          aria-label="Attach a file"
          title="Attach a document (saved to Knowledge)"
          className="state-layer relative flex size-10 shrink-0 items-center justify-center rounded-[16px] text-muted-foreground transition-colors hover:text-violet"
        >
          <Paperclip className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </button>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Message Mycroft…"
          aria-label="Message Mycroft"
          rows={Math.min(6, Math.max(1, draft.split("\n").length))}
          className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || chatPending}
          aria-label="Send message"
          className="accent-fill state-layer relative flex size-10 shrink-0 items-center justify-center rounded-[16px] text-primary-foreground shadow-[0_10px_24px_-12px_var(--violet)] transition-opacity disabled:opacity-40"
        >
          <Send className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </button>
      </form>
    </section>
  )
}
