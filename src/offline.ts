import type { OfflineAnswer, Portfolio } from './types';

/**
 * Deterministic fallback used when the model is unavailable (no key, quota used up, outage).
 * Same "never guess" rule as the model: keyword intents first, then a project search,
 * and an honest "not covered" answer when nothing matches.
 */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').trim();
const hasWord = (q: string, w: string) => new RegExp(`(^|\\s)${w.replace(/[.+#]/g, '\\$&')}`).test(q);

type Intent = { words: string[]; answer: (p: Portfolio) => OfflineAnswer };

const intents: Intent[] = [
  {
    words: ['stack', 'tech', 'skill', 'framework', 'language', 'tool'],
    answer: (p) => ({ text: p.skills.map((s) => `${s.group}: ${s.items.join(', ')}`).join('. ') + '.' }),
  },
  {
    words: ['demo', 'live', 'try'],
    answer: (p) => {
      const live = p.projects.filter((x) => x.demoUrl);
      return live.length
        ? { text: `You can try ${live.map((x) => x.name).join(', ')} live.`, projects: live.map((x) => x.slug) }
        : { text: 'None of my projects have a public demo yet.' };
    },
  },
  {
    words: ['hire', 'available', 'availability', 'contact', 'email', 'price', 'cost', 'rate', 'budget'],
    answer: (p) => ({ text: `${p.availability}. Every project is scoped first, so the best next step is an email to ${p.email}.` }),
  },
  {
    words: ['where', 'location', 'based', 'timezone', 'remote'],
    answer: (p) => ({ text: `${p.location}.` }),
  },
];

/** Ranks projects by how many question words appear in their name, tagline, stack and summary. */
function searchProjects(p: Portfolio, q: string) {
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  return p.projects
    .map((x) => {
      const hay = norm(`${x.name} ${x.tagline} ${x.stack.join(' ')} ${x.summary}`);
      return { x, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((r) => r.score >= Math.min(2, words.length))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.x);
}

export function offlineAnswer(p: Portfolio, question: string): OfflineAnswer {
  const q = norm(question);
  if (!q) return { text: 'Ask me anything about my projects, stack or availability.' };

  // The intent with the most keyword hits wins.
  const best = intents
    .map((intent) => ({ intent, hits: intent.words.filter((w) => hasWord(q, w)).length }))
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)[0];
  if (best) return best.intent.answer(p);

  const found = searchProjects(p, q);
  if (found.length) {
    return { text: `Here's what matches in my work: ${found.map((x) => `${x.name} (${x.tagline})`).join('; ')}.`, projects: found.map((x) => x.slug) };
  }
  return { text: `That isn't covered in my portfolio, and I'd rather not guess. Email me at ${p.email} and I'll answer directly.` };
}
