import { describe, expect, it, vi } from 'vitest';
import { createRateLimiter, withFallback } from '../src';

const busy = () => Promise.reject(Object.assign(new Error('busy'), { status: 503 }));

describe('withFallback', () => {
  it('moves to the next model when one is busy or out of quota', async () => {
    const second = vi.fn(() => Promise.resolve('from lite model'));
    await expect(withFallback([busy, second])).resolves.toBe('from lite model');
    expect(second).toHaveBeenCalledOnce();
  });

  it('does not retry real failures (bad key, bad request)', async () => {
    const second = vi.fn(() => Promise.resolve('never'));
    const auth = () => Promise.reject(Object.assign(new Error('unauthorised'), { status: 401 }));
    await expect(withFallback([auth, second])).rejects.toThrow('unauthorised');
    expect(second).not.toHaveBeenCalled();
  });

  it('throws when every model is busy', async () => {
    await expect(withFallback([busy, busy])).rejects.toThrow('busy');
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit per window, then resets', () => {
    let t = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect([limiter.allow('a'), limiter.allow('a'), limiter.allow('a')]).toEqual([true, true, false]);
    expect(limiter.allow('b')).toBe(true);
    t = 1000;
    expect(limiter.allow('a')).toBe(true);
  });
});
