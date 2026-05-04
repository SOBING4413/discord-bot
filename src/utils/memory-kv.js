/**
 * MemoryKV — In-memory key-value store that mimics Cloudflare KV API
 * 
 * Supports: get(), put(), delete() with JSON and text types.
 * For production, replace with Redis, Upstash, or a database.
 */

class MemoryKV {
  constructor() {
    this.store = new Map();
  }

  async get(key, type = "text") {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    if (type === "json") {
      try {
        return JSON.parse(entry.value);
      } catch {
        return null;
      }
    }

    return entry.value;
  }

  async put(key, value, options = {}) {
    const entry = {
      value: value,
      expiresAt: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null,
    };
    this.store.set(key, entry);
  }

  async delete(key) {
    this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || "";
    const keys = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key });
      }
    }
    return { keys };
  }
}

// Singleton instance shared across the app
export const kv = new MemoryKV();