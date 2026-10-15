import { describe, expect, it } from 'vitest';
import { offlineAnswer } from '../src';
import { samplePortfolio as p } from '../examples/sample-portfolio';

describe('offlineAnswer', () => {
  it('answers stack questions from the skills data', () => {
    expect(offlineAnswer(p, 'What is your tech stack?').text).toContain('Next.js');
  });

  it('lists only projects that really have a demo', () => {
    const a = offlineAnswer(p, 'Can I try a live demo?');
    expect(a.projects).toEqual(['invoicely']);
  });

  it('never quotes a price', () => {
    const a = offlineAnswer(p, 'How much do you cost?');
    expect(a.text).toContain('scoped');
    expect(a.text).not.toMatch(/\$\d/);
  });

  it('finds projects by their content when no intent matches', () => {
    expect(offlineAnswer(p, 'appointment receptionist clinic').projects).toContain('clinic-bot');
  });

  it('admits when something is not covered instead of guessing', () => {
    expect(offlineAnswer(p, 'What is your favourite football team?').text).toMatch(/isn't covered/);
  });
});
