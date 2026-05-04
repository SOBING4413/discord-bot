/**
 * 🗳️ Interactive Commands — Poll, Giveaway, Ticket
 */

export class PollCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const question = interaction.data.options?.[0]?.value;
    const optionsStr = interaction.data.options?.[1]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const options = optionsStr ? optionsStr.split("|").map(o => o.trim()) : ["Yes", "No"];
    const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    const optionsText = options.slice(0, 10).map((opt, i) => `${numberEmojis[i]} ${opt}`).join("\n");

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `📊 Poll: ${question}`,
          description: optionsText,
          color: 0x5865f2,
          footer: { text: `Poll by ${userName} • React to vote!` },
        }],
      },
    });
  }
}

export class GiveawayCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const prize = interaction.data.options?.[0]?.value;
    const duration = interaction.data.options?.[1]?.value || "1h";
    const winners = interaction.data.options?.[2]?.value || 1;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const durationMatch = duration.match(/^(\d+)(s|m|h|d)$/i);
    if (!durationMatch) {
      return ({
        type: 4,
        data: { embeds: [this.embed.error("⏰ Invalid Duration", "Format: `5m`, `1h`, `2d`")], flags: 64 },
      });
    }

    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const endTime = Date.now() + (amount * multipliers[unit]);
    const unitNames = { s: "detik", m: "menit", h: "jam", d: "hari" };

    // Store giveaway in KV
    if (this.env.CONVERSATIONS_KV) {
      await this.env.CONVERSATIONS_KV.put(`giveaway:${interaction.channel_id}:${Date.now()}`, JSON.stringify({
        prize,
        endTime,
        winners,
        channelId: interaction.channel_id,
        createdBy: userName,
      }), { expirationTtl: Math.ceil((amount * multipliers[unit]) / 1000) + 60 });
    }

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🎉 GIVEAWAY!",
          description: `**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R> (${amount} ${unitNames[unit]})\n\nReact with 🎉 to enter!`,
          color: 0xf1c40f,
          footer: { text: `Hosted by ${userName} • RED ENGINE` },
        }],
      },
    });
  }
}

export class TicketCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const subcommand = interaction.data.options?.[0];
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    if (subcommand?.name === "create") {
      const reason = subcommand.options?.[0]?.value || "No reason provided";

      // Store ticket in KV
      const ticketId = `ticket_${Date.now()}`;
      if (this.env.CONVERSATIONS_KV) {
        await this.env.CONVERSATIONS_KV.put(`ticket:${ticketId}`, JSON.stringify({
          id: ticketId,
          userId,
          userName,
          reason,
          status: "open",
          createdAt: Date.now(),
        }), { expirationTtl: 86400 * 7 });
      }

      return ({
        type: 4,
        data: {
          embeds: [{
            title: `🎫 Ticket Created — ${ticketId}`,
            description: `**User:** ${userName}\n**Reason:** ${reason}\n**Status:** 🟢 Open\n\nA support channel will be created for you. Please wait for a staff member to respond.`,
            color: 0x2ecc71,
            footer: { text: "🔴 RED ENGINE • Ticket System" },
          }],
          flags: 64,
        },
      });
    }

    if (subcommand?.name === "close") {
      return ({
        type: 4,
        data: { embeds: [this.embed.success("🎫 Ticket Closed", "This ticket has been closed. Thank you!")], flags: 64 },
      });
    }

    return ({ type: 4, data: { content: "Use `/ticket create` or `/ticket close`" } });
  }
}