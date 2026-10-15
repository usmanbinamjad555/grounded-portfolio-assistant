import { GoogleGenAI } from '@google/genai';
import type { ChatTurn } from './types';

/** The one thing the handler needs from a model: history in, text out (or null when unavailable). */
export type Generate = (history: ChatTurn[], systemPrompt: string) => Promise<string | null>;

/** Errors that mean "busy or out of quota right now": worth retrying on the next model. */
const isTransient = (err: unknown) => {
  const status = (err as { status?: number }).status;
  return status === 503 || status === 429;
};

/** Runs attempts in order; moves on only after a transient error. Any other error is a real failure. */
export async function withFallback<T>(attempts: (() => Promise<T>)[]): Promise<T> {
  for (const [i, attempt] of attempts.entries()) {
    try {
      return await attempt();
    } catch (err) {
      if (i === attempts.length - 1 || !isTransient(err)) throw err;
    }
  }
  throw new Error('withFallback needs at least one attempt');
}

/** Gemini (free tier): a busy primary model falls through to a lighter one. */
export function geminiGenerate({ apiKey, models = ['gemini-flash-latest', 'gemini-flash-lite-latest'] }: { apiKey: string; models?: string[] }): Generate {
  const ai = new GoogleGenAI({ apiKey });
  return async (history, systemPrompt) => {
    const contents = history.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] }));
    const res = await withFallback(
      models.map(
        (model) => () =>
          ai.models.generateContent({
            model,
            contents,
            // Generous cap: newer models spend part of it on internal reasoning; the prompt keeps answers short.
            config: { systemInstruction: systemPrompt, maxOutputTokens: 2048, temperature: 0.4 },
          }),
      ),
    );
    return res.text?.trim() || null;
  };
}
