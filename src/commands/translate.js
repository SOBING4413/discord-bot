export class TranslateCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const text = interaction.data.options?.[0]?.value;
    const target = interaction.data.options?.[1]?.value || "id";
    const userId = interaction.member?.user?.id || interaction.user?.id;

    const langNames = {
      id: "Bahasa Indonesia", en: "English", ja: "日本語", ko: "한국어",
      zh: "中文", es: "Español", fr: "Français", de: "Deutsch",
      ar: "العربية", pt: "Português", ru: "Русский", th: "ไทย", vi: "Tiếng Việt",
    };

    const prompt = `Translate the following text to ${langNames[target] || target}. 
Only output the translation, nothing else. Maintain the original tone and formatting.

Text:
${text}`;

    const response = await this.ai.chat(prompt, `translate_${userId}`, userId, {
      model: "gpt-4o-mini",
      systemPrompt: "You are a professional translator. Translate accurately while preserving meaning, tone, and formatting. Only output the translation.",
      history: [],
    });

    return ({
      type: 4,
      data: {
        embeds: [
          this.embed.translation(text, response, langNames[target] || target),
        ],
      },
    });
  }
}