/**
 * ============================================
 * 🔴 RED ENGINE v3.0 — Cloudflare Worker
 * 
 * 🧠 Text: Dolphin 2.9.4 Llama 3.1 8B
 * 🎨 Image: Pony Diffusion V6 XL
 * 🎵 Music: MusicGen
 * 👁️ Vision: LLaVA
 * 📝 Transcribe: Whisper
 * 🗣️ TTS: Bark
 * 🎬 Video: Stable Video Diffusion
 * ============================================
 */

import { CommandRegistry } from "./src/commands/index.js";
import { AIEngine } from "./src/ai/engine.js";
import { RateLimiter } from "./src/utils/rate-limiter.js";
import { ConversationManager } from "./src/conversation/manager.js";
import { EmbedBuilder } from "./src/utils/embed-builder.js";
import { Logger } from "./src/utils/logger.js";
import { verifyDiscordSignature } from "./src/utils/crypto.js";

const BOT_NAME = "RED ENGINE";

export default {
  async fetch(request, env, ctx) {
    const logger = new Logger(env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp",
        },
      });
    }

    if (request.method === "GET") {
      if (request.url.endsWith("/health")) {
        return Response.json({
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
      }
      return new Response("🔴 RED ENGINE is active!", { status: 200 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const body = await request.text();

    if (!signature || !timestamp) {
      logger.warn("Missing signature headers");
      return new Response("Unauthorized", { status: 401 });
    }

    const isValid = await verifyDiscordSignature(signature, timestamp, body, env.DISCORD_PUBLIC_KEY);

    if (!isValid) {
      logger.warn("Invalid Discord signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    const ai = new AIEngine(env);
    const conversations = new ConversationManager(env);
    const rateLimiter = new RateLimiter(env);
    const embedBuilder = new EmbedBuilder();

    if (interaction.type === 2) {
      const userId = interaction.member?.user?.id || interaction.user?.id;
      const guildId = interaction.guild_id;

      const rateLimitResult = await rateLimiter.check(userId, guildId);
      if (!rateLimitResult.allowed) {
        return Response.json({
          type: 4,
          data: {
            embeds: [embedBuilder.warning("⏳ Rate Limited", `Terlalu banyak request. Coba lagi dalam **${rateLimitResult.retryAfter} detik**.`)],
            flags: 64,
          },
        });
      }

      const registry = new CommandRegistry(ai, conversations, embedBuilder, env, logger);
      return await registry.handle(interaction);
    }

    if (interaction.type === 3) {
      return await handleComponent(interaction, ai, conversations, embedBuilder, env, logger);
    }

    if (interaction.type === 5) {
      return await handleModalSubmit(interaction, ai, conversations, embedBuilder, env, logger);
    }

    if (interaction.type === 4) {
      return await handleAutoComplete(interaction, env);
    }

    return Response.json({ type: 4, data: { content: "❓ Unknown interaction." } });
  },
};

async function handleComponent(interaction, ai, conversations, embedBuilder, env, logger) {
  const customId = interaction.data.custom_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

  try {
    if (customId.startsWith("provider_")) {
      const provider = customId.replace("provider_", "");
      await conversations.setUserPreference(userId, "provider", provider);
      return Response.json({
        type: 4,
        data: { embeds: [embedBuilder.success("✅ Provider Changed", `Text AI provider switched to **${provider}**`)], flags: 64 },
      });
    }

    if (customId.startsWith("model_")) {
      const model = customId.replace("model_", "");
      await conversations.setUserPreference(userId, "model", model);
      return Response.json({
        type: 4,
        data: { embeds: [embedBuilder.success("✅ Model Changed", `AI model switched to **${model}**`)], flags: 64 },
      });
    }

    if (customId.startsWith("lang_")) {
      const lang = customId.replace("lang_", "");
      await conversations.setUserPreference(userId, "language", lang);
      return Response.json({
        type: 4,
        data: { embeds: [embedBuilder.success("✅ Language Changed", `Response language switched to **${lang}**`)], flags: 64 },
      });
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

        return Response.json({
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
        });
      }
    }

    if (customId.startsWith("continue_")) {
      return Response.json({
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
      });
    }

    if (customId.startsWith("clear_")) {
      const conversationId = customId.replace("clear_", "");
      await conversations.clear(conversationId);
      return Response.json({
        type: 7,
        data: { embeds: [embedBuilder.success("🗑️ Cleared", "Conversation history has been cleared.")], components: [] },
      });
    }

    return Response.json({ type: 4, data: { content: "✅ Action received!" } });
  } catch (error) {
    logger.error("Component handler error", error);
    return Response.json({
      type: 4,
      data: { embeds: [embedBuilder.error("Error", "Something went wrong.")], flags: 64 },
    });
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

      return Response.json({
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
      });
    }

    return Response.json({ type: 4, data: { content: "✅ Modal submitted!" } });
  } catch (error) {
    logger.error("Modal handler error", error);
    return Response.json({
      type: 4,
      data: { embeds: [embedBuilder.error("Error", "Failed to process input.")], flags: 64 },
    });
  }
}

async function handleAutoComplete(interaction, env) {
  const focusedOption = interaction.data.options?.find(o => o.focused);
  if (!focusedOption) return Response.json({ type: 8, data: { choices: [] } });

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

  return Response.json({ type: 8, data: { choices: choices.slice(0, 25) } });
}