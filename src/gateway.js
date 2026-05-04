/**
 * 🔴 RED ENGINE — Gateway Client
 * Connects to Discord Gateway to show bot as online.
 * Interactions are still handled by the Express server.
 */

import { Client, GatewayIntentBits, ActivityType } from "discord.js";

let client = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY = 5000; // 5 seconds

export function getGatewayStatus() {
  if (!client) return { connected: false, status: "not_initialized", tag: null, guilds: 0, reconnectAttempts };
  const ready = client.isReady?.() ?? false;
  // Use isReady() as the source of truth — client.status can be unreliable in discord.js v14
  const status = ready ? "Ready" : "Disconnected";
  return {
    connected: ready,
    status,
    tag: client.user?.tag ?? null,
    guilds: client.guilds?.cache?.size ?? 0,
    reconnectAttempts,
    uptime: client.uptime ?? null,
  };
}

async function attemptLogin(token) {
  console.log(`📡 Gateway login attempt #${reconnectAttempts + 1}...`);
  try {
    await client.login(token);
    reconnectAttempts = 0;
    console.log("📡 Gateway login call resolved, waiting for ready event...");
  } catch (err) {
    reconnectAttempts++;
    console.error(`❌ Gateway login failed (attempt ${reconnectAttempts}):`, err.message);
    if (err.code) console.error(`   Error code: ${err.code}`);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = RECONNECT_BASE_DELAY * Math.pow(2, Math.min(reconnectAttempts - 1, 5));
      console.log(`🔄 Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return attemptLogin(token);
    } else {
      console.error(`❌ Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      client = null;
    }
  }
}

export async function startGateway(env) {
  const token = env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ DISCORD_BOT_TOKEN not set, skipping Gateway connection");
    console.warn("⚠️ Make sure to set DISCORD_BOT_TOKEN in Railway environment variables!");
    return;
  }

  if (client) {
    console.log("📡 Gateway client already exists, status:", client.isReady?.() ? "ready" : "not ready");
    return;
  }

  console.log("🔑 DISCORD_BOT_TOKEN found (length:", token.length, "), initializing Gateway client...");

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
    ],
    rest: { timeout: 30000 },
    ws: {
      properties: {
        browser: "Discord.js",
      },
    },
  });

  client.on("clientReady", () => {
    console.log(`🟢 Bot online as ${client.user.tag}`);
    console.log(`🏠 Serving ${client.guilds.cache.size} guild(s)`);
    client.user.setActivity("🔴 RED ENGINE v3.0", {
      type: ActivityType.Playing,
    });
  });

  client.on("error", (err) => {
    console.error("❌ Gateway error:", err.message);
    if (err.code) console.error("   Error code:", err.code);
  });

  // discord.js v14 uses "close" instead of "disconnect"
  client.on("close", (event) => {
    console.warn(`⚠️ Gateway closed — code: ${event?.code}, reason: ${event?.reason || "none"}`);
  });

  client.on("reconnecting", () => {
    console.log("🔄 Gateway reconnecting...");
  });

  client.on("resume", () => {
    console.log("✅ Gateway resumed connection");
  });

  client.on("warn", (info) => {
    console.warn("⚠️ Gateway warn:", info);
  });

  client.on("debug", (info) => {
    // Only log debug during initial connection to diagnose issues
    if (!client.isReady()) {
      console.log(`🔍 [DEBUG] ${info}`);
    }
  });

  try {
    await attemptLogin(token);
  } catch (err) {
    console.error("❌ Fatal Gateway startup error:", err.message);
    client = null;
  }
}