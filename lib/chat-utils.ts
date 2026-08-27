/**
 * Frontend-only heuristics for the Chat workspace. There's no structured
 * signal from tools/text_chat.py for either of these -- an action_guard
 * confirmation and a completed generate_document call both arrive as
 * ordinary streamed assistant text (see text_chat.py's _handle_chat_request:
 * the confirmation_required tool result "becomes an ordinary tool-result
 * message the model reads and asks about in ITS OWN next reply, as chat
 * text instead of speech"). ROADMAP.md's Session C also flags that the
 * model doesn't always phrase a confirmation ask the same way, so neither
 * check here is a guarantee -- both are best-effort pattern matches on the
 * finished message text, applied only once streaming completes.
 */

const CONFIRMATION_PATTERN =
  /\b(shall i|should i|do you want me to|can i go ahead|okay to|ok to|confirm|would you like me to)\b.*\?[\s]*$/i

/** True if the assistant's finished reply reads like it's asking
 * permission before an action_guard-gated tool call (send_gmail,
 * generate_document) -- drives whether the Chat workspace shows inline
 * Confirm/Cancel chips under that message. */
export function looksLikeConfirmationRequest(text: string): boolean {
  return CONFIRMATION_PATTERN.test(text.trim())
}

// generate_document's supported formats (tools/document_gen.py) -- a
// filename with one of these extensions, mentioned anywhere in a finished
// assistant reply, is treated as "a document was just created" for the
// in-chat "Open in Knowledge" affordance. Deliberately not stricter (e.g.
// requiring "I've created" nearby) since the model's own phrasing varies;
// a false positive here just shows an extra chip, which is low-cost.
const DOCUMENT_FILENAME_PATTERN = /\b[\w][\w \-]*\.(docx|pdf|txt|md)\b/gi

/** The first generated-document-looking filename mentioned in a finished
 * assistant reply, or null if none. */
export function extractDocumentFilename(text: string): string | null {
  const match = text.match(DOCUMENT_FILENAME_PATTERN)
  return match ? match[0].trim() : null
}
