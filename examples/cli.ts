// Try it locally: npm run ask -- "Which projects can I try live?"
// Uses Gemini when GEMINI_API_KEY is set, otherwise the offline engine.
import { createAskHandler, geminiGenerate } from '../src';
import { samplePortfolio } from './sample-portfolio';

const apiKey = process.env.GEMINI_API_KEY;
const handle = createAskHandler({ portfolio: samplePortfolio, generate: apiKey ? geminiGenerate({ apiKey }) : undefined });

const question = process.argv.slice(2).join(' ') || 'What is your tech stack?';
const res = await handle(new Request('http://localhost/api/ask', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: question }] }) }));
const { reply, source } = (await res.json()) as { reply: string; source: string };
console.log(`[${source}] ${reply}`);
