/**
 * Rate Limiter - Per-user and per-guild rate limiting
 * 
 * Converted from Cloudflare KV to in-memory Map storage.
 * For production, consider using Redis for distributed rate limiting.
 */

const rateStore = new Map();

export class RateLimiter {
  constructor(env) {
    this.env = env;
  }

  async check(userId, guildId) {
    try {
      const key = `rate:${userId}`;
      const now = Math.floor(Date.now() / 1000);
      const windowSize = 60; // 1 minute window
      const maxRequests = 15; // Max 15 requests per minute

      const data = rateStore.get(key) || { requests: [], warned: false };

      // Clean old requests outside the window
      data.requests = data.requests.filter(ts => now - ts < windowSize);

      if (data.requests.length >= maxRequests) {
        const oldestInWindow = data.requests[0];
        const retryAfter = oldestInWindow + windowSize - now;

        return {
          allowed: false,
          retryAfter: retryAfter,
          remaining: 0,
          limit: maxRequests,
        };
      }

      // Add current request
      data.requests.push(now);
      rateStore.set(key, data);

      return {
        allowed: true,
        remaining: maxRequests - data.requests.length,
        limit: maxRequests,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      return { allowed: true }; // Fail open
    }
  }
}