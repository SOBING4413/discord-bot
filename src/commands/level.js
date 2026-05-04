/**
 * 📊 Level & XP System
 */

export class LevelCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const data = await this._getUserData(userId);

    const level = data.level || 1;
    const xp = data.xp || 0;
    const xpNeeded = this._xpForLevel(level);
    const progress = Math.min((xp / xpNeeded) * 100, 100);
    const progressBar = this._createProgressBar(progress);

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `📊 Level — ${userName}`,
          fields: [
            { name: "⭐ Level", value: `${level}`, inline: true },
            { name: "✨ XP", value: `${xp} / ${xpNeeded}`, inline: true },
            { name: "📈 Progress", value: `${progressBar} ${progress.toFixed(1)}%`, inline: false },
            { name: "💬 Messages", value: `${data.messages || 0}`, inline: true },
            { name: "🏆 Rank", value: this._getRank(level), inline: true },
          ],
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE • Level System" },
        }],
        flags: 64,
      },
    });
  }

  async addXP(userId, amount = 1) {
    if (!this.env.CONVERSATIONS_KV) return;
    const data = await this._getUserData(userId);
    data.xp = (data.xp || 0) + amount;
    data.messages = (data.messages || 0) + 1;

    const xpNeeded = this._xpForLevel(data.level || 1);
    if (data.xp >= xpNeeded) {
      data.level = (data.level || 1) + 1;
      data.xp = data.xp - xpNeeded;
    }

    await this.env.CONVERSATIONS_KV.put(`level:${userId}`, JSON.stringify(data), { expirationTtl: 86400 * 365 });
    return data;
  }

  async _getUserData(userId) {
    if (!this.env.CONVERSATIONS_KV) return { level: 1, xp: 0, messages: 0 };
    try {
      return (await this.env.CONVERSATIONS_KV.get(`level:${userId}`, "json")) || { level: 1, xp: 0, messages: 0 };
    } catch {
      return { level: 1, xp: 0, messages: 0 };
    }
  }

  _xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  _createProgressBar(percent) {
    const filled = Math.round(percent / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }

  _getRank(level) {
    if (level >= 50) return "👑 Legend";
    if (level >= 30) return "💎 Diamond";
    if (level >= 20) return "🥇 Gold";
    if (level >= 10) return "🥈 Silver";
    if (level >= 5) return "🥉 Bronze";
    return "🌱 Newcomer";
  }
}

export class LeaderboardCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    // Note: Full leaderboard requires listing KV keys which is limited
    // This provides a template that works with the level system
    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🏆 Leaderboard",
          description: "Level leaderboard will populate as users interact with RED ENGINE!\n\nUse commands to earn XP:\n💬 `/ask`, `/chat` — 5 XP\n🎨 `/image` — 10 XP\n🎵 `/music` — 8 XP\n🎮 `/trivia`, `/quiz` — 15 XP",
          color: 0xf1c40f,
          footer: { text: "🔴 RED ENGINE • Level System" },
        }],
      },
    });
  }
}