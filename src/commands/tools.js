/**
 * Tool Commands — Math, Remind, PDF
 */

export class MathCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const expression = interaction.data.options?.[0]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const response = await this.ai.chat(
      `Solve this math problem step by step: ${expression}

Show:
1. The problem
2. Step-by-step solution
3. Final answer (boxed)

Use clear formatting with markdown.`,
      `math_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      {
        systemPrompt: "You are a math expert. Solve problems step by step. Show all work clearly. Use proper mathematical notation. If the input is not a math problem, explain what you can do instead.",
        maxTokens: 1500,
      }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `🔢 Math — ${expression.substring(0, 80)}`,
          description: response,
          color: 0x3498db,
          footer: { text: `Solved by ${userName} • Dolphin AI` },
        }],
      },
    });
  }
}

export class RemindCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const time = interaction.data.options?.[0]?.value;
    const message = interaction.data.options?.[1]?.value;
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Parse time (simple: "5m", "1h", "30s", "2d")
    const timeMatch = time.match(/^(\d+)(s|m|h|d)$/i);
    if (!timeMatch) {
      return ({
        type: 4,
        data: {
          embeds: [this.embed.error("⏰ Invalid Time", "Format: `5m` (5 menit), `1h` (1 jam), `30s` (30 detik), `2d` (2 hari)")],
          flags: 64,
        },
      });
    }

    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const delayMs = amount * multipliers[unit];
    const remindAt = Date.now() + delayMs;

    // Store reminder in KV
    if (this.env.CONVERSATIONS_KV) {
      try {
        const reminderId = `reminder:${userId}:${Date.now()}`;
        await this.env.CONVERSATIONS_KV.put(reminderId, JSON.stringify({
          userId,
          message,
          remindAt,
          channelId: interaction.channel_id,
          createdAt: Date.now(),
        }), { expirationTtl: Math.ceil(delayMs / 1000) + 60 });
      } catch (e) {
        console.error("Reminder KV error:", e);
      }
    }

    const unitNames = { s: "detik", m: "menit", h: "jam", d: "hari" };

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "⏰ Reminder Set!",
          description: `**Message:** ${message}\n**Remind in:** ${amount} ${unitNames[unit]}\n**At:** <t:${Math.floor(remindAt / 1000)}:R>`,
          color: 0xf39c12,
          footer: { text: `Set by ${userName}` },
        }],
        flags: 64,
      },
    });
  }
}

export class PDFCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const url = interaction.data.options?.[0]?.value;
    const question = interaction.data.options?.[1]?.value || "Summarize this document";
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Use AI to analyze PDF content description
    const response = await this.ai.chat(
      `Analyze this document/PDF: ${url}\n\nQuestion: ${question}`,
      `pdf_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      {
        systemPrompt: "You are a document analysis assistant. If a URL is provided, describe what you can infer about it. For PDF analysis, the user should provide the document content directly. Provide helpful analysis based on available information.",
        maxTokens: 1500,
      }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "📄 PDF Analysis",
          description: response,
          color: 0xe74c3c,
          footer: { text: `Analyzed by ${userName} • Dolphin AI` },
        }],
      },
    });
  }
}