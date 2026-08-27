"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, useEditorState, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "@tiptap/markdown"
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"

// Idle-typing delay before an edit is written back to local_db.py --
// short enough that "Saved" shows up quickly, long enough not to fire a
// request on every keystroke.
const AUTOSAVE_DEBOUNCE_MS = 900

type SaveState = "idle" | "saving" | "saved"

const TOOLBAR_BUTTON =
  "state-layer relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] aria-pressed:text-violet"

export function NoteEditor({
  noteId,
  initialTitle,
  initialBody,
  onBack,
}: {
  /** undefined for a brand-new, not-yet-saved note -- the first edit
   * creates the row (via addNote) instead of updating one. */
  noteId?: string
  initialTitle: string
  initialBody: string
  onBack: () => void
}) {
  const { addNote, updateNote } = useMycroft()

  const [title, setTitle] = useState(initialTitle)
  const [saveState, setSaveState] = useState<SaveState>("idle")

  // Mutable, not state -- flush() and the unmount cleanup both need the
  // latest values without re-subscribing to a changing autosave callback
  // on every keystroke.
  const idRef = useRef<string | null>(noteId ?? null)
  const latestRef = useRef({ title: initialTitle, body: initialBody })
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const debounceRef = useRef<number | null>(null)

  const flush = useCallback(async () => {
    if (!dirtyRef.current || savingRef.current) return
    savingRef.current = true
    dirtyRef.current = false
    setSaveState("saving")
    const { title: t, body } = latestRef.current
    try {
      if (idRef.current === null) {
        const newId = await addNote(t, body)
        if (newId) idRef.current = newId
      } else {
        await updateNote(idRef.current, { title: t, body })
      }
      setSaveState("saved")
    } finally {
      savingRef.current = false
      // More edits landed while this save was in flight -- flush again so
      // they aren't stranded as "dirty" with nothing scheduled to send
      // them (the debounce timer that would normally do this already
      // fired to get us here).
      if (dirtyRef.current) flush()
    }
  }, [addNote, updateNote])

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveState("idle")
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null
      flush()
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [flush])

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialBody,
    contentType: "markdown",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      latestRef.current.body = editor.getMarkdown()
      scheduleSave()
    },
  })

  // useEditor's default shouldRerenderOnTransaction is false in Tiptap v3
  // (a perf change from v2) -- reading editor.isActive() straight in JSX
  // would silently freeze the toolbar's active-state highlighting at
  // whatever it was on first render. useEditorState subscribes to just
  // this derived slice and re-renders only when it actually changes.
  const activeMarks = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            h1: editor.isActive("heading", { level: 1 }),
            h2: editor.isActive("heading", { level: 2 }),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
          }
        : null,
  })

  function handleTitleChange(value: string) {
    setTitle(value)
    latestRef.current.title = value
    scheduleSave()
  }

  // Flush-on-unmount -- a debounce timer that never fires because the
  // editor closed first is the classic way to lose the last few seconds
  // of typing, and for class notes that's the worst possible failure.
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      if (dirtyRef.current) flush()
    }
  }, [flush])

  const saveLabel = saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to notes"
          className="state-layer relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled note"
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground">{saveLabel}</span>
      </div>

      <div className="glass-soft flex items-center gap-0.5 rounded-full p-1">
        <button
          type="button"
          aria-pressed={activeMarks?.bold ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={TOOLBAR_BUTTON}
        >
          <Bold className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={activeMarks?.italic ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={TOOLBAR_BUTTON}
        >
          <Italic className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={activeMarks?.underline ?? false}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={TOOLBAR_BUTTON}
        >
          <UnderlineIcon className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-pressed={activeMarks?.h1 ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={TOOLBAR_BUTTON}
        >
          <Heading1 className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={activeMarks?.h2 ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={TOOLBAR_BUTTON}
        >
          <Heading2 className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-pressed={activeMarks?.bulletList ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={TOOLBAR_BUTTON}
        >
          <List className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={activeMarks?.orderedList ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={TOOLBAR_BUTTON}
        >
          <ListOrdered className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div
        onClick={() => editor?.chain().focus().run()}
        className={cn(
          // WorkspaceShell's scroll container isn't itself a flex parent,
          // so flex-1 here can't stretch to fill the remaining viewport --
          // a fixed generous min-height gives a real writing surface
          // instead of a box that shrinks to its content.
          "glass-soft min-h-[60vh] flex-1 cursor-text overflow-y-auto rounded-[24px] p-5",
          "[&_.tiptap]:min-h-full [&_.tiptap]:text-sm [&_.tiptap]:leading-relaxed [&_.tiptap]:text-foreground [&_.tiptap]:outline-none",
          "[&_.tiptap_h1]:text-xl [&_.tiptap_h1]:font-semibold [&_.tiptap_h1]:tracking-tight",
          "[&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:tracking-tight",
          "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5",
          "[&_.tiptap_p]:my-1.5 [&_.tiptap_h1]:my-2 [&_.tiptap_h2]:my-2",
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
