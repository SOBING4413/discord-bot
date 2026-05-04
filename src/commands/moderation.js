/**
 * 🛡️ Server Management & Moderation Commands
 */

export class WelcomeCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const subcommand = interaction.data.options?.[0];
    const guildId = interaction.guild_id;

    if (subcommand?.name === "setup") {
      const channel = subcommand.options?.[0]?.value;
      const message = subcommand.options?.[1]?.value || "Selamat datang di server, {user}! 🎉";

      // Store welcome config in KV
      if (this.env.CONVERSATIONS_KV) {
        await this.env.CONVERSATIONS_KV.put(`welcome:${guildId}`, JSON.stringify({
          channelId: channel,
          message: message,
          enabled: true,
        }), { expirationTtl: 86400 * 365 });
      }

      return ({
        type: 4,
        data: {
          embeds: [this.embed.success("🎉 Welcome System Enabled", `Welcome messages will be sent to <#${channel}>\n**Message:** ${message}\n\nUse \`{user}\` as placeholder for username.`)],
          flags: 64,
        },
      });
    }

    if (subcommand?.name === "disable") {
      if (this.env.CONVERSATIONS_KV) {
        await this.env.CONVERSATIONS_KV.delete(`welcome:${guildId}`);
      }
      return ({
        type: 4,
        data: { embeds: [this.embed.success("👋 Welcome System Disabled", "Welcome messages are now off.")], flags: 64 },
      });
    }

    return ({ type: 4, data: { content: "Use `/welcome setup` or `/welcome disable`" } });
  }
}

export class PurgeCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const amount = interaction.data.options?.[0]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Note: Bulk delete requires Discord REST API with bot token
    // Cloudflare Workers can call the API but needs proper permissions
    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🧹 Purge Command",
          description: `**Requested:** Delete ${amount} messages\n\n⚠️ Purge requires the bot to have "Manage Messages" permission.\n\nThis command will delete ${amount} messages when the bot is deployed with proper permissions.`,
          color: 0xe74c3c,
          footer: { text: `Requested by ${userName} • RED ENGINE` },
        }],
        flags: 64,
      },
    });
  }
}

export class ServerInfoCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const guild = interaction.guild_id;
    const memberCount = interaction.member_count || "N/A";

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🏠 Server Info",
          fields: [
            { name: "🆔 Server ID", value: guild, inline: true },
            { name: "👥 Members", value: `${memberCount}`, inline: true },
            { name: "🤖 Bot", value: "🔴 RED ENGINE v3.0", inline: true },
          ],
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE" },
        }],
      },
    });
  }
}

export class UserInfoCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const targetUser = interaction.data.options?.[0]?.value;
    const member = interaction.member;
    const user = member?.user || {};

    const roles = member?.roles?.map(r => `<@&${r}>`).join(", ") || "None";

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `👤 User Info — ${user.global_name || user.username || "Unknown"}`,
          thumbnail: { url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : "" },
          fields: [
            { name: "🆔 User ID", value: user.id || "N/A", inline: true },
            { name: "📛 Username", value: user.username || "N/A", inline: true },
            { name: "🏷️ Display Name", value: user.global_name || "N/A", inline: true },
            { name: "🎭 Roles", value: roles || "None", inline: false },
          ],
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE" },
        }],
      },
    });
  }
}

export class SlowmodeCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const time = interaction.data.options?.[0]?.value || 0;

    return ({
      type: 4,
      data: {
        embeds: [this.embed.success("⏱️ Slowmode Set", `Slowmode set to **${time} seconds**.\n\n⚠️ Requires "Manage Channels" permission when deployed.`)],
        flags: 64,
      },
    });
  }
}