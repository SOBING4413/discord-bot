/**
 * Conversation Manager - Persistent conversation history
 * 
 * Uses MemoryKV (Cloudflare KV-compatible API) for storage.
 * For production, consider using Redis, SQLite, or a database.
 */

import { kv } from "../utils/memory-kv.js";

export class ConversationManager {
  constructor(env) {
    this.env = env;
    this.kv = env.CONVERSATIONS_KV || kv;
  }

  _getKey(conversationId) {
    return `conv:${conversationId}`;
  }

  _getUserPrefKey(userId) {
    return `prefs:${userId}`;
  }

  async getHistory(conversationId) {
    try {
      const data = await this.kv.get(this._getKey(conversationId), "json");
      return data?.messages || [];
    } catch {
      return [];
    }
  }

  async addMessage(conversationId, role, content) {
    try {
      const key = this._getKey(conversationId);
      const data = (await this.kv.get(key, "json")) || { messages: [], createdAt: Date.now() };
      data.messages.push({
        role,
        content,
        timestamp: Date.now(),
      });
      // Keep only last 50 messages
      if (data.messages.length > 50) {
        data.messages = data.messages.slice(-50);
      }
      data.updatedAt = Date.now();
      await this.kv.put(key, JSON.stringify(data), { expirationTtl: 86400 * 7 }); // 7 days TTL
    } catch (error) {
      console.error("KV write error:", error);
    }
  }

  async clear(conversationId) {
    try {
      await this.kv.delete(this._getKey(conversationId));
    } catch (error) {
      console.error("KV delete error:", error);
    }
  }

  async getStats(conversationId) {
    try {
      const data = await this.kv.get(this._getKey(conversationId), "json");
      return {
        messageCount: data?.messages?.length || 0,
        createdAt: data?.createdAt || null,
        updatedAt: data?.updatedAt || null,
      };
    } catch {
      return { messageCount: 0, createdAt: null };
    }
  }

  // User preferences
  async getUserPreference(userId, key) {
    try {
      const prefs = (await this.kv.get(this._getUserPrefKey(userId), "json")) || {};
      return prefs[key] || null;
    } catch {
      return null;
    }
  }

  async setUserPreference(userId, key, value) {
    try {
      const prefs = (await this.kv.get(this._getUserPrefKey(userId), "json")) || {};
      prefs[key] = value;
      await this.kv.put(this._getUserPrefKey(userId), JSON.stringify(prefs), { expirationTtl: 86400 * 30 });
    } catch (error) {
      console.error("KV pref write error:", error);
    }
  }

  async getAllPreferences(userId) {
    try {
      return (await this.kv.get(this._getUserPrefKey(userId), "json")) || {};
    } catch {
      return {};
    }
  }

  // Generate conversation ID
  static createId(userId, channelId) {
    return `${userId}_${channelId}`;
  }
}