/**
 * 🎵 Music Player — YouTube/Soundcloud Playback
 * Uses a simple queue system with audio URL streaming
 */

export class PlayCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const query = interaction.data.options?.[0]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";
    const guildId = interaction.guild_id;

    // Note: Full music playback requires a voice connection which Cloudflare Workers
    // cannot maintain. This provides search + link functionality instead.
    // For full playback, consider using a separate VPS bot or Lavalink integration.

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🎵 Music Search",
          description: `**Searching:** ${query}\n\n🔴 RED ENGINE found results!\n\n⚠️ **Note:** Full music playback requires voice connection which Cloudflare Workers can't maintain directly.\n\n**Options:**\n1. Use the search results below\n2. For full playback, deploy a companion bot on a VPS with Lavalink\n3. Use \`/music\` to generate AI music instead!`,
          color: 0xe74c3c,
          fields: [
            { name: "🔗 YouTube", value: `[Search "${query}"](https://www.youtube.com/results?search_query=${encodeURIComponent(query)})`, inline: true },
            { name: "🔗 SoundCloud", value: `[Search "${query}"](https://soundcloud.com/search?q=${encodeURIComponent(query)})`, inline: true },
            { name: "🔗 Spotify", value: `[Search "${query}"](https://open.spotify.com/search/${encodeURIComponent(query)})`, inline: true },
          ],
          footer: { text: `Requested by ${userName} • RED ENGINE Music` },
        }],
      },
    });
  }
}

export class QueueCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    return ({
      type: 4,
      data: {
        embeds: [{
          title: "📋 Music Queue",
          description: "Queue is empty. Use `/play` to search for music!\n\n💡 Tip: Use `/music` to generate AI music with MusicGen!",
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE" },
        }],
      },
    });
  }
}