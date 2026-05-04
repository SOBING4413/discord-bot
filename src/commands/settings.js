export class SettingsCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const prefs = await this.conversations.getAllPreferences(userId);

    const configuredProviders = [];
    if (this.env.GROQ_API_KEY) configuredProviders.push("⚡ Groq");
    if (this.env.HF_API_KEY) configuredProviders.push("🤗 HuggingFace");
    if (this.env.TOGETHER_API_KEY) configuredProviders.push("🤝 Together AI");
    if (this.env.OPENROUTER_API_KEY) configuredProviders.push("🌐 OpenRouter");
    if (this.env.REPLICATE_API_KEY) configuredProviders.push("🔄 Replicate");

    return ({
      type: 4,
      data: {
        embeds: [
          {
            title: "⚙️ RED ENGINE Settings",
            description: `**AI Models:**\n🧠 Text: Dolphin 2.9.4 Llama 3.1 8B\n🎨 Image: Pony Diffusion V6 XL\n\n**Configured Providers:**\n${configuredProviders.length > 0 ? configuredProviders.join("\n") : "❌ No API keys configured"}`,
            color: 0xe74c3c,
            fields: [
              { name: "🤖 Text Provider", value: prefs.provider ? `\`${prefs.provider}\`` : "`groq` (default)", inline: true },
              { name: "🌐 Language", value: prefs.language ? `\`${prefs.language}\`` : "`id` (default)", inline: true },
              { name: "🎨 Style", value: prefs.style ? `\`${prefs.style}\`` : "`friendly` (default)", inline: true },
              { name: "🖼️ Image Provider", value: prefs.imageProvider ? `\`${prefs.imageProvider}\`` : "`huggingface` (default)", inline: true },
            ],
            footer: { text: "🔴 RED ENGINE • Settings per user" },
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 3,
                custom_id: "provider_select",
                placeholder: "Select Text AI Provider",
                options: [
                  { label: "⚡ Groq (Fast & Free)", value: "provider_groq", description: "Llama 3.1 8B", emoji: { name: "⚡" } },
                  { label: "🤗 HuggingFace", value: "provider_huggingface", description: "Dolphin 2.9.4 direct", emoji: { name: "🤗" } },
                  { label: "🤝 Together AI", value: "provider_together", description: "Dolphin hosting", emoji: { name: "🤝" } },
                  { label: "🌐 OpenRouter", value: "provider_openrouter", description: "Multi-model proxy", emoji: { name: "🌐" } },
                ],
              },
            ],
          },
          {
            type: 1,
            components: [
              {
                type: 3,
                custom_id: "lang_select",
                placeholder: "Select Language",
                options: [
                  { label: "Bahasa Indonesia", value: "lang_id", emoji: { name: "🇮🇩" } },
                  { label: "English", value: "lang_en", emoji: { name: "🇺🇸" } },
                  { label: "日本語", value: "lang_ja", emoji: { name: "🇯🇵" } },
                  { label: "한국어", value: "lang_ko", emoji: { name: "🇰🇷" } },
                ],
              },
            ],
          },
        ],
        flags: 64,
      },
    });
  }
}