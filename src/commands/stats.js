export class StatsCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";
    const prefs = await this.conversations.getAllPreferences(userId);

    // Get conversation stats
    const channelId = interaction.channel_id;
    const conversationId = `conv:${userId}_${channelId}`;
    const chatConvId = `conv:chat_${userId}_${channelId}`;
    const askStats = await this.conversations.getStats(`${userId}_${channelId}`);
    const chatStats = await this.conversations.getStats(`chat_${userId}_${channelId}`);

    return ({
      type: 4,
      data: {
        embeds: [
          {
            title: `📊 Stats — ${userName}`,
            color: 0x57f287,
            fields: [
              {
                name: "💬 Ask Conversations",
                value: `Messages: **${askStats.messageCount}**`,
                inline: true,
              },
              {
                name: "🗨️ Chat Conversations",
                value: `Messages: **${chatStats.messageCount}**`,
                inline: true,
              },
              {
                name: "🤖 Current Model",
                value: `\`${prefs.model || "gpt-4o-mini"}\``,
                inline: true,
              },
              {
                name: "🌐 Language",
                value: `\`${prefs.language || "id"}\``,
                inline: true,
              },
              {
                name: "🎨 Style",
                value: `\`${prefs.style || "friendly"}\``,
                inline: true,
              },
            ],
            footer: { text: "Stats are per-channel" },
          },
        ],
        flags: 64,
      },
    });
  }
}