export class HelpCommand {
  constructor(embedBuilder) {
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    return ({
      type: 4,
      data: {
        embeds: [
          {
            title: "🔴 RED ENGINE v3.0 — All Commands",
            description: "**35 Commands • 7 AI Models • All-in-One Bot**",
            color: 0xe74c3c,
            fields: [
              {
                name: "🧠 Text AI (6)",
                value: "`/ask` `/chat` `/translate` `/code` `/summarize` `/explain`",
                inline: false,
              },
              {
                name: "🎨 Image (1)",
                value: "`/image <prompt> [style]`",
                inline: false,
              },
              {
                name: "🎵 Audio (3)",
                value: "`/music` `/tts` `/transcribe`",
                inline: false,
              },
              {
                name: "👁️ Vision (3)",
                value: "`/analyze` `/ocr` `/video`",
                inline: false,
              },
              {
                name: "🔍 Search & Info (4)",
                value: "`/search` `/news` `/weather` `/crypto`",
                inline: false,
              },
              {
                name: "🎮 Fun & Games (4)",
                value: "`/trivia` `/8ball` `/meme` `/quiz`",
                inline: false,
              },
              {
                name: "🛠️ Tools (3)",
                value: "`/math` `/remind` `/pdf`",
                inline: false,
              },
              {
                name: "🎭 Persona System (1)",
                value: "`/persona list|set|create|remove` — Custom AI personalities!",
                inline: false,
              },
              {
                name: "🎵 Music Player (2)",
                value: "`/play` `/queue`",
                inline: false,
              },
              {
                name: "🛡️ Server Management (5)",
                value: "`/welcome` `/purge` `/serverinfo` `/userinfo` `/slowmode`",
                inline: false,
              },
              {
                name: "🗳️ Interactive (3)",
                value: "`/poll` `/giveaway` `/ticket`",
                inline: false,
              },
              {
                name: "📊 Level System (2)",
                value: "`/level` `/leaderboard` — Earn XP by using commands!",
                inline: false,
              },
              {
                name: "🖼️ Image Tools (3)",
                value: "`/upscale` `/avatar` `/countdown`",
                inline: false,
              },
              {
                name: "⚙️ Settings (3)",
                value: "`/settings` `/stats` `/help`",
                inline: false,
              },
            ],
            footer: { text: "🔴 RED ENGINE • 35 Commands • Cloudflare Workers • v3.0" },
          },
        ],
      },
    });
  }
}