// Next.js App Router: copy to app/api/ask/route.ts.
// Without GEMINI_API_KEY the endpoint still works and answers from the offline engine.
import { createAskHandler, geminiGenerate } from '../../src';
import { samplePortfolio } from '../sample-portfolio';

export const runtime = 'nodejs';

const apiKey = process.env.GEMINI_API_KEY;

export const POST = createAskHandler({
  portfolio: samplePortfolio,
  generate: apiKey ? geminiGenerate({ apiKey }) : undefined,
  perHour: 20,
});
