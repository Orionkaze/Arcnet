import { createClient, type RedisClientType } from "redis";

type RateLimitInfo = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  success: boolean;
  remaining?: number;
  resetAt?: number;
};

// ---------------------------------------------------------------------------
// In-memory fallback (also the default when REDIS_URL is unset)
// ---------------------------------------------------------------------------
const store = new Map<string, RateLimitInfo>();

function checkRateLimitMemory(
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

// ---------------------------------------------------------------------------
// Redis path (used only when REDIS_URL is set)
// ---------------------------------------------------------------------------
// Module-singleton client. We create it lazily on first use and connect once,
// guarding against concurrent connect attempts with a shared promise. Any Redis
// failure degrades transparently to the in-memory limiter — we never throw out
// of checkRateLimit and never fail-open to "always allow".
let redisClient: RedisClientType | null = null;
let redisConnecting: Promise<void> | null = null;
let redisUnavailable = false;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisUnavailable) return null;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisClient && redisClient.isReady) return redisClient;

  if (!redisClient) {
    redisClient = createClient({ url });
    // Attach an error handler so a Redis outage never throws unhandled.
    redisClient.on("error", () => {
      // Swallow: errors surface via connect()/command rejections and the
      // isReady guard, which route callers to the in-memory fallback.
    });
  }

  // Guard against concurrent connects: share a single in-flight promise.
  if (!redisConnecting) {
    redisConnecting = redisClient
      .connect()
      .then(() => undefined)
      .catch((err) => {
        // Give up on Redis for the remainder of the process; fall back to memory.
        redisUnavailable = true;
        throw err;
      })
      .finally(() => {
        redisConnecting = null;
      });
  }

  await redisConnecting;
  return redisClient && redisClient.isReady ? redisClient : null;
}

async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    // Not connected / not ready — fall back to in-memory.
    return checkRateLimitMemory(key, limit, windowMs);
  }

  const rlKey = `rl:${key}`;
  const n = await client.incr(rlKey);
  if (n === 1) {
    await client.expire(rlKey, Math.ceil(windowMs / 1000));
  }
  return { success: n <= limit, remaining: Math.max(0, limit - n) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  let result: RateLimitResult;

  if (process.env.REDIS_URL) {
    try {
      result = await checkRateLimitRedis(key, limit, windowMs);
    } catch {
      // ANY Redis error (timeout, not connected, etc.) degrades to in-memory.
      // Never throw out of checkRateLimit; never fail-open to "always allow".
      result = checkRateLimitMemory(key, limit, windowMs);
    }
  } else {
    result = checkRateLimitMemory(key, limit, windowMs);
  }

  // Centralized security logging: emit one structured audit line when a check
  // fails (rate limited). The key already encodes action + ip/email/user.
  if (!result.success) {
    console.warn(
      JSON.stringify({
        evt: "rate_limit_exceeded",
        key,
        max: limit,
        windowMs,
        ts: new Date().toISOString(),
      })
    );
  }

  return result;
}

export function clearRateLimit(key: string) {
  store.delete(key);
}
