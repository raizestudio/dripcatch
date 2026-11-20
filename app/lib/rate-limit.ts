interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const store = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 1_000;

function pruneExpired(now: number, windowMs: number) {
  if (store.size <= MAX_TRACKED_KEYS) return;

  for (const [key, timestamps] of store.entries()) {
    const valid = timestamps.filter((ts) => now - ts < windowMs);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, valid);
    }
  }
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now, windowMs);

  const existing = store.get(key) ?? [];
  const activeTimestamps = existing.filter((ts) => now - ts < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldestInWindow = activeTimestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestInWindow + windowMs - now) / 1000),
    );
    store.set(key, activeTimestamps);

    return {
      success: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  store.set(key, activeTimestamps);

  return {
    success: true,
    remaining: Math.max(0, limit - activeTimestamps.length),
    retryAfterSeconds: 0,
  };
}
