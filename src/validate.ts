import type { ChatTurn } from './types';

export const MAX_TURNS = 10;
export const MAX_CHARS = 600;

/**
 * Turns untrusted JSON into a safe chat history: known roles only, trimmed and length-capped text,
 * only the last MAX_TURNS turns, and it must end with a user message. Returns null when invalid.
 */
export function parseHistory(body: unknown): ChatTurn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw)) return null;
  const history = raw
    .slice(-MAX_TURNS)
    .filter(
      (t): t is ChatTurn =>
        !!t && typeof t === 'object' && ((t as ChatTurn).role === 'user' || (t as ChatTurn).role === 'assistant') && typeof (t as ChatTurn).content === 'string',
    )
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, MAX_CHARS) }))
    .filter((t) => t.content.length > 0);
  if (!history.length || history[history.length - 1].role !== 'user') return null;
  return history;
}
