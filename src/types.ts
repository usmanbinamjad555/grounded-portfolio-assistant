/** The facts the assistant may use. Everything it says must come from here. */
export type Portfolio = {
  name: string;
  role: string;
  location: string;
  availability: string;
  email: string;
  summary: string;
  skills: { group: string; items: string[] }[];
  projects: {
    slug: string;
    name: string;
    tagline: string;
    summary: string;
    stack: string[];
    demoUrl?: string;
  }[];
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** A deterministic answer from the offline engine. */
export type OfflineAnswer = { text: string; projects?: string[] };
