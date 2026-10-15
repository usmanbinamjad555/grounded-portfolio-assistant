/**
 * Fixed-window counter per key (for example a hashed IP), kept in memory.
 * Good enough for one server instance; on serverless with many instances, back it with a shared
 * store (Postgres, Redis) using the same interface.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    /** Records a hit and returns true when the key is still within its limit. */
    allow(key: string): boolean {
      const t = now();
      // Drop expired windows now and then, so memory stays bounded on a long-running server.
      if (hits.size > 10_000) for (const [k, e] of hits) if (t >= e.resetAt) hits.delete(k);
      const entry = hits.get(key);
      if (!entry || t >= entry.resetAt) {
        hits.set(key, { count: 1, resetAt: t + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
  };
}
