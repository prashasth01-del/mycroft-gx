"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"
import { NotesGallery } from "./notes-gallery"
import { NoteEditor } from "./note-editor"

// null = gallery. "new" = a not-yet-saved note (see note-editor.tsx's
// idRef -- the first edit is what actually creates the row). Otherwise
// the id of an existing note being edited.
type OpenTarget = "new" | string | null

export function NotesWorkspace() {
  const { notes } = useMycroft()
  const [open, setOpen] = useState<OpenTarget>(null)

  const editingNote = open && open !== "new" ? notes.find((n) => n.id === open) : null

  return (
    <WorkspaceShell
      icon={FileText}
      title="Notes"
      subtitle={open ? undefined : `${notes.length} notes`}
    >
      {open === "new" ? (
        <NoteEditor key="new" initialTitle="" initialBody="" onBack={() => setOpen(null)} />
      ) : editingNote ? (
        <NoteEditor
          key={editingNote.id}
          noteId={editingNote.id}
          initialTitle={editingNote.title === "Untitled note" ? "" : editingNote.title}
          initialBody={editingNote.body}
          onBack={() => setOpen(null)}
        />
      ) : (
        <NotesGallery notes={notes} onOpen={setOpen} onNew={() => setOpen("new")} />
      )}
    </WorkspaceShell>
  )
}
