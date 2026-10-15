import type { Generate } from './model';
import { offlineAnswer } from './offline';
import { buildSystemPrompt } from './prompt';
import { createRateLimiter } from './rate-limit';
import type { Portfolio } from './types';
import { parseHistory } from './validate';

const MAX_BODY_BYTES = 16 * 1024;

type Options = {
  portfolio: Portfolio;
  /** Omit (for example when no API key is set) to always answer with the offline engine. */
  generate?: Generate;
  /** Requests per client per hour. */
  perHour?: number;
  now?: () => number;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/**
 * Web-standard handler: (Request) => Response, so it runs unchanged in a Next.js route handler,
 * Vercel/Netlify functions, Cloudflare Workers, Deno or Bun.
 *
 * POST { messages: ChatTurn[] } -> { reply, source: 'model' | 'offline' }.
 * The visitor always gets an answer: rate limits, missing keys and model failures fall back to the
 * offline engine instead of an error.
 */
export function createAskHandler({ portfolio, generate, perHour = 20, now }: Options) {
  const systemPrompt = buildSystemPrompt(portfolio);
  const limiter = createRateLimiter({ limit: perHour, windowMs: 60 * 60 * 1000, now });

  return async function handle(req: Request): Promise<Response> {
    if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: 'Invalid JSON.' }, 400);
    }
    const history = parseHistory(body);
    if (!history) return json({ error: 'Invalid request.' }, 400);

    const question = history[history.length - 1].content;
    const offline = () => json({ reply: offlineAnswer(portfolio, question).text, source: 'offline' });

    const client = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!generate || !limiter.allow(client)) return offline();

    try {
      const reply = await generate(history, systemPrompt);
      return reply ? json({ reply, source: 'model' }) : offline();
    } catch (err) {
      console.error('model failed, answering offline', err);
      return offline();
    }
  };
}
