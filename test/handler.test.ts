import { describe, expect, it, vi } from 'vitest';
import { createAskHandler, type Generate } from '../src';
import { samplePortfolio } from '../examples/sample-portfolio';

const ask = (content: string, ip = '1.1.1.1') =>
  new Request('http://localhost/api/ask', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
    body: JSON.stringify({ messages: [{ role: 'user', content }] }),
  });

describe('createAskHandler', () => {
  it('answers with the model and passes the grounded system prompt', async () => {
    const generate = vi.fn<Generate>(async () => 'I built Invoicely.');
    const res = await createAskHandler({ portfolio: samplePortfolio, generate })(ask('What did you build?'));
    expect(await res.json()).toEqual({ reply: 'I built Invoicely.', source: 'model' });
    const [history, prompt] = generate.mock.calls[0];
    expect(history).toEqual([{ role: 'user', content: 'What did you build?' }]);
    expect(prompt).toContain('Answer only from PORTFOLIO DATA');
    expect(prompt).toContain('Invoicely');
  });

  it('still answers (offline) without a model', async () => {
    const res = await createAskHandler({ portfolio: samplePortfolio })(ask('What is your stack?'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.source).toBe('offline');
  });

  it('falls back to offline when the model throws or returns nothing', async () => {
    const failing = createAskHandler({ portfolio: samplePortfolio, generate: async () => Promise.reject(new Error('down')) });
    const empty = createAskHandler({ portfolio: samplePortfolio, generate: async () => null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await (await failing(ask('stack?'))).json()).source).toBe('offline');
    expect((await (await empty(ask('stack?'))).json()).source).toBe('offline');
  });

  it('switches a client to offline answers after the hourly limit', async () => {
    const generate = vi.fn<Generate>(async () => 'model answer');
    const handle = createAskHandler({ portfolio: samplePortfolio, generate, perHour: 2 });
    const sources = [];
    for (let i = 0; i < 3; i++) sources.push((await (await handle(ask('hi'))).json()).source);
    expect(sources).toEqual(['model', 'model', 'offline']);
    expect((await (await handle(ask('hi', '2.2.2.2'))).json()).source).toBe('model');
  });

  it('rejects bad requests', async () => {
    const handle = createAskHandler({ portfolio: samplePortfolio });
    expect((await handle(new Request('http://localhost', { method: 'GET' }))).status).toBe(405);
    expect((await handle(new Request('http://localhost', { method: 'POST', body: '{nope' }))).status).toBe(400);
    expect((await handle(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(20_000) }))).status).toBe(413);
  });
});
