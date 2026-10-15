import type { Portfolio } from '../src';

/** Fictional sample data. Replace it with your own; the assistant will only ever talk about what is here. */
export const samplePortfolio: Portfolio = {
  name: 'Alex Rivera',
  role: 'Full-Stack Engineer',
  location: 'Remote, UTC+1',
  availability: 'Open to freelance projects',
  email: 'alex@example.com',
  summary: 'I build SaaS products on Next.js and Postgres, and add AI features that work with the data a product already has.',
  skills: [
    { group: 'Frontend', items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'] },
    { group: 'Backend', items: ['Node.js', 'PostgreSQL', 'Supabase', 'Stripe'] },
    { group: 'AI', items: ['Gemini', 'OpenAI API', 'function calling', 'retrieval'] },
  ],
  projects: [
    {
      slug: 'invoicely',
      name: 'Invoicely',
      tagline: 'Multi-tenant invoicing SaaS with Stripe billing',
      summary: 'Teams create, send and track invoices; access rules are enforced in the database with row-level security.',
      stack: ['Next.js', 'Supabase', 'PostgreSQL', 'Stripe'],
      demoUrl: 'https://example.com/invoicely',
    },
    {
      slug: 'clinic-bot',
      name: 'Clinic Assistant',
      tagline: 'AI receptionist that answers questions and books appointments',
      summary: 'Answers only from the clinic knowledge base and hands over to staff for anything clinical.',
      stack: ['Node.js', 'Gemini', 'function calling'],
    },
  ],
};
