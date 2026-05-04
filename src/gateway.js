/**
 * 🔴 RED ENGINE — Gateway Client
 * Connects to Discord Gateway to show bot as online.
 * Interactions are still handled by the Express server.
 */

import { Client, GatewayIntentBits, ActivityType } from "discord.js";

let client = null;

export async function startGateway(env) {
  const token = env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ DISCORD_BOT_TOKEN not set, skipping Gateway connection");
    return;
  }

  if (client) {
    console.log("📡 Gateway client already exists");
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
    ],
  });

  client.on("ready", () => {
    console.log(`🟢 Bot online as ${client.user.tag}`);
    client.user.setActivity("🔴 RED ENGINE v3.0", {
      type: ActivityType.Playing,
    });
  });

  client.on("error", (err) => {
    console.error("❌ Gateway error:", err.message);
  });

  client.on("disconnect", () => {
    console.warn("⚠️ Gateway disconnected, will auto-reconnect");
  });

  try {
    await client.login(token);
    console.log("📡 Gateway connecting...");
  } catch (err) {
    console.error("❌ Failed to connect to Gateway:", err.message);
    client = null;
  }
}