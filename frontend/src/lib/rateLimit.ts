type RateLimitInfo = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitInfo>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const info = store.get(key) || { count: 0, resetAt: now + windowMs };

  // If window expired, reset
  if (now > info.resetAt) {
    info.count = 0;
    info.resetAt = now + windowMs;
  }

  if (info.count >= limit) {
    return { success: false, remaining: 0, resetAt: info.resetAt };
  }

  info.count += 1;
  store.set(key, info);

  return { success: true, remaining: limit - info.count, resetAt: info.resetAt };
}

export function clearRateLimit(key: string) {
  store.delete(key);
}
