/**
 * Chat Command — Powered by Dolphin 2.9.4 Llama 3.1 8B
 * https://huggingface.co/dphn/dolphin-2.9.4-llama3.1-8b
 */

export class ChatCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const message = interaction.data.options?.[0]?.value;
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";
    const channelId = interaction.channel_id;
    const conversationId = `chat_${userId}_${channelId}`;

    const prefs = await this.conversations.getAllPreferences(userId);
    const history = await this.conversations.getHistory(conversationId);

    const response = await this.ai.chat(message, conversationId, userId, {
      provider: prefs.provider || "groq",
      systemPrompt: `Kamu adalah teman chat yang ramah, asyik, dan pintar. 
Kamu menggunakan model Dolphin 2.9.4 Llama 3.1 8B.
Jawab dengan santai dan friendly dalam Bahasa Indonesia.
Gunakan emoji yang sesuai. Bisa bercanda tapi tetap sopan.
Kalau ditanya hal serius, jawab dengan serius juga.`,
      history: history,
    });

    await this.conversations.addMessage(conversationId, "user", message);
    await this.conversations.addMessage(conversationId, "assistant", response);

    return ({
      type: 4,
      data: {
        embeds: [this.embed.chatResponse(userName, message, response)],
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