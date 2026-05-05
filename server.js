/**
 * ============================================
 * 🔴 RED ENGINE v3.0 — Railway Express Server
 * 
 * Converted from Cloudflare Workers to Railway
 * ============================================
 */

import "dotenv/config";
import express from "express";
import { verifyDiscordSignature } from "./src/utils/crypto.js";
import { CommandRegistry } from "./src/commands/index.js";
import { AIEngine } from "./src/ai/engine.js";
import { RateLimiter } from "./src/utils/rate-limiter.js";
import { ConversationManager } from "./src/conversation/manager.js";
import { EmbedBuilder } from "./src/utils/embed-builder.js";
import { Logger } from "./src/utils/logger.js";
import { kv } from "./src/utils/memory-kv.js";
import { startGateway, getGatewayStatus } from "./src/gateway.js";

// ============================================
// Attach MemoryKV to process.env so all command
// files that reference env.CONVERSATIONS_KV work
// without modification.
// ============================================
process.env.CONVERSATIONS_KV = kv;

const app = express();
const PORT = process.env.PORT || 3000;

// Raw body parser for Discord signature verification
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf.toString(); } }));

const BOT_NAME = process.env.BOT_NAME || "RED ENGINE";

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "online",
    name: BOT_NAME,
    version: "3.0.0",
    models: {
      text: "Dolphin 2.9.4 Llama 3.1 8B",
      image: "Pony Diffusion V6 XL",
      music: "MusicGen Small",
      tts: "Bark",
      transcribe: "Whisper Large V3",
      vision: "LLaVA 1.5",
      video: "Stable Video Diffusion",
    },
    commands: 24,
  });
});

// Gateway status diagnostic endpoint
app.get("/gateway-status", (_req, res) => {
  const gateway = getGatewayStatus();
  const hasToken = !!process.env.DISCORD_BOT_TOKEN;
  res.json({
    gateway,
    env: {
      DISCORD_BOT_TOKEN_set: hasToken,
      DISCORD_PUBLIC_KEY_set: !!process.env.DISCORD_PUBLIC_KEY,
      DISCORD_APPLICATION_ID_set: !!process.env.DISCORD_APPLICATION_ID,
      PORT: process.env.PORT || "3000 (default)",
      NODE_ENV: process.env.NODE_ENV || "not set",
    },
  });
});

app.get("/", (_req, res) => {
  res.send("🔴 RED ENGINE is active!");
});

// Discord interaction endpoint
app.post("/", async (req, res) => {
  const env = process.env;
  const logger = new Logger(env);

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const body = req.rawBody;

  if (!signature || !timestamp) {
    logger.warn("Missing signature headers");
    return res.status(401).send("Unauthorized");
  }

  const isValid = await verifyDiscordSignature(signature, timestamp, body, env.DISCORD_PUBLIC_KEY);

  if (!isValid) {
    logger.warn("Invalid Discord signature");
    return res.status(401).send("Invalid signature");
  }

  const interaction = req.body;

  // Ping verification
  if (interaction.type === 1) {
    return res.json({ type: 1 });
  }

  const ai = new AIEngine(env);
  const conversations = new ConversationManager(env);
  const rateLimiter = new RateLimiter(env);
  const embedBuilder = new EmbedBuilder();

  // Application command
  if (interaction.type === 2) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const guildId = interaction.guild_id;

    const rateLimitResult = await rateLimiter.check(userId, guildId);
    if (!rateLimitResult.allowed) {
      return res.json({
        type: 4,
        data: {
          embeds: [embedBuilder.warning("⏳ Rate Limited", `Terlalu banyak request. Coba lagi dalam **${rateLimitResult.retryAfter} detik**.`)],
          flags: 64,
        },
      });
    }

    const registry = new CommandRegistry(ai, conversations, embedBuilder, env, logger);
    const result = await registry.handle(interaction);
    return res.json(result);
  }

  // Message component
  if (interaction.type === 3) {
    const result = await handleComponent(interaction, ai, conversations, embedBuilder, env, logger);
    return res.json(result);
  }

  // Modal submit
  if (interaction.type === 5) {
    const result = await handleModalSubmit(interaction, ai, conversations, embedBuilder, env, logger);
    return res.json(result);
  }

  // Autocomplete
  if (interaction.type === 4) {
    const result = await handleAutoComplete(interaction, env);
    return res.json(result);
  }

  return res.json({ type: 4, data: { content: "❓ Unknown interaction." } });
});

async function handleComponent(interaction, ai, conversations, embedBuilder, env, logger) {
  const customId = interaction.data.custom_id;
  const selectedValue = interaction.data.values?.[0];
  const actionId = selectedValue || customId;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

  try {
    if (actionId.startsWith("provider_")) {
      const provider = actionId.replace("provider_", "");
      await conversations.setUserPreference(userId, "provider", provider);
      return {
        type: 4,
        data: { embeds: [embedBuilder.success("✅ Provider Changed", `Text AI provider switched to **${provider}**`)], flags: 64 },
      };
    }

    if (actionId.startsWith("model_")) {
      const model = actionId.replace("model_", "");
      await conversations.setUserPreference(userId, "model", model);
      return {
        type: 4,
        data: { embeds: [embedBuilder.success("✅ Model Changed", `AI model switched to **${model}**`)], flags: 64 },
      };
    }

    if (actionId.startsWith("lang_")) {
      const lang = actionId.replace("lang_", "");
      await conversations.setUserPreference(userId, "language", lang);
      return {
        type: 4,
        data: { embeds: [embedBuilder.success("✅ Language Changed", `Response language switched to **${lang}**`)], flags: 64 },
      };
    }

    if (customId.startsWith("regenerate_")) {
      const conversationId = customId.replace("regenerate_", "");
      const history = await conversations.getHistory(conversationId);
      const lastUserMsg = [...history].reverse().find(m => m.role === "user");

      if (lastUserMsg) {
        const prefs = await conversations.getAllPreferences(userId);
        const newResponse = await ai.chat(lastUserMsg.content, conversationId, userId, {
          provider: prefs.provider || "groq",
          style: prefs.style || "friendly",
          language: prefs.language || "id",
        });
        await conversations.addMessage(conversationId, "assistant", newResponse);

        return {
          type: 7,
          data: {
            embeds: [embedBuilder.aiResponse(userName, lastUserMsg.content, newResponse)],
            components: [
              {
                type: 1,
                components: [
                  { type: 2, style: 2, label: "🔄 Regenerate", custom_id: `regenerate_${conversationId}`, emoji: { name: "🔄" } },
                  { type: 2, style: 2, label: "💬 Continue", custom_id: `continue_${conversationId}`, emoji: { name: "💬" } },
                  { type: 2, style: 4, label: "🗑️ Clear", custom_id: `clear_${conversationId}`, emoji: { name: "🗑️" } },
                ],
              },
            ],
          },
        };
      }
    }

    if (customId.startsWith("continue_")) {
      return {
        type: 9,
        data: {
          custom_id: `continue_modal_${customId.replace("continue_", "")}`,
          title: "💬 Continue Chat — RED ENGINE",
          components: [
            {
              type: 1,
              components: [
                { type: 4, custom_id: "message_input", style: 2, label: "Your Message", placeholder: "Type your message...", max_length: 1000 },
              ],
            },
          ],
        },
      };
    }

    if (customId.startsWith("clear_")) {
      const conversationId = customId.replace("clear_", "");
      await conversations.clear(conversationId);
      return {
        type: 7,
        data: { embeds: [embedBuilder.success("🗑️ Cleared", "Conversation history has been cleared.")], components: [] },
      };
    }

    return { type: 4, data: { content: "✅ Action received!" } };
  } catch (error) {
    logger.error("Component handler error", error);
    return {
      type: 4,
      data: { embeds: [embedBuilder.error("Error", "Something went wrong.")], flags: 64 },
    };
  }
}

async function handleModalSubmit(interaction, ai, conversations, embedBuilder, env, logger) {
  const customId = interaction.data.custom_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

  try {
    if (customId.startsWith("continue_modal_")) {
      const conversationId = customId.replace("continue_modal_", "");
      const message = interaction.data.components[0].components[0].value;

      const prefs = await conversations.getAllPreferences(userId);
      const response = await ai.chat(message, conversationId, userId, {
        provider: prefs.provider || "groq",
        style: prefs.style || "friendly",
        language: prefs.language || "id",
      });

      await conversations.addMessage(conversationId, "user", message);
      await conversations.addMessage(conversationId, "assistant", response);

      return {
        type: 4,
        data: {
          embeds: [embedBuilder.aiResponse(userName, message, response)],
          components: [
            {
              type: 1,
              components: [
                { type: 2, style: 2, label: "🔄 Regenerate", custom_id: `regenerate_${conversationId}`, emoji: { name: "🔄" } },
                { type: 2, style: 2, label: "💬 Continue", custom_id: `continue_${conversationId}`, emoji: { name: "💬" } },
                { type: 2, style: 4, label: "🗑️ Clear", custom_id: `clear_${conversationId}`, emoji: { name: "🗑️" } },
              ],
            },
          ],
        },
      };
    }

    return { type: 4, data: { content: "✅ Modal submitted!" } };
  } catch (error) {
    logger.error("Modal handler error", error);
    return {
      type: 4,
      data: { embeds: [embedBuilder.error("Error", "Failed to process input.")], flags: 64 },
    };
  }
}

async function handleAutoComplete(interaction, env) {
  const focusedOption = interaction.data.options?.find(o => o.focused);
  if (!focusedOption) return { type: 8, data: { choices: [] } };

  let choices = [];

  if (focusedOption.name === "language") {
    choices = [
      { name: "🇮🇩 Bahasa Indonesia", value: "id" },
      { name: "🇺🇸 English", value: "en" },
      { name: "🇯🇵 日本語", value: "ja" },
      { name: "🇰🇷 한국어", value: "ko" },
      { name: "🇨🇳 中文", value: "zh" },
      { name: "🇪🇸 Español", value: "es" },
      { name: "🇫🇷 Français", value: "fr" },
      { name: "🇩🇪 Deutsch", value: "de" },
    ].filter(c => c.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
  }

  if (focusedOption.name === "style") {
    choices = [
      { name: "🎯 Professional", value: "professional" },
      { name: "😊 Friendly", value: "friendly" },
      { name: "🎓 Educational", value: "educational" },
      { name: "💻 Technical", value: "technical" },
      { name: "🎨 Creative", value: "creative" },
    ].filter(c => c.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
  }

  return { type: 8, data: { choices: choices.slice(0, 25) } };
}

// Global error handlers to catch silent failures
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  // Don't exit — keep the server alive
});

app.listen(PORT, async () => {
  console.log(`🔴 RED ENGINE v3.0 running on port ${PORT}`);
  console.log(`📡 Interactions URL: http://localhost:${PORT}/`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);

  // Start Gateway connection to show bot as online (await to catch errors)
  try {
    await startGateway(process.env);
    console.log("📡 Gateway startup sequence completed");
  } catch (err) {
    console.error("❌ Gateway startup failed:", err.message);
  }
});
