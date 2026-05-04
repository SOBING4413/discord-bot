/**
 * 🖼️ Image Tools — Upscale, Style Transfer, Avatar
 */

export class UpscaleCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const imageUrl = interaction.data.options?.[0]?.value;
    const scale = interaction.data.options?.[1]?.value || 2;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Try HuggingFace Real-ESRGAN
    const hfKey = this.ai.env?.HF_API_KEY;
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/nightmareai/real-esrgan",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${hfKey}` },
            body: JSON.stringify({ inputs: imageUrl, parameters: { scale } }),
          }
        );

        if (response.status === 503) {
          return ({
            type: 4,
            data: { embeds: [this.embed.warning("⏳ Model Loading", "Upscale model sedang loading. Coba lagi dalam 30 detik.")] },
          });
        }

        if (response.ok) {
          const imageBlob = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));
          return ({
            type: 4,
            data: {
              embeds: [{
                title: `🖼️ Image Upscaled (${scale}x)`,
                description: `**Original:** [Link](${imageUrl})\n**Scale:** ${scale}x\n**Model:** Real-ESRGAN`,
                color: 0xe74c3c,
                footer: { text: `By ${userName} • RED ENGINE` },
              }],
            },
          });
        }
      } catch (e) {
        console.error("Upscale error:", e);
      }
    }

    return ({
      type: 4,
      data: { embeds: [this.embed.error("🖼️ Upscale Failed", "Butuh HF_API_KEY untuk fitur upscale.")] },
    });
  }
}

export class AvatarCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const targetUser = interaction.data.options?.[0]?.value;
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const user = interaction.member?.user || {};
    const userName = user.global_name || user.username || "User";

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || "0") % 5}.png`;

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `🖼️ Avatar — ${userName}`,
          image: { url: avatarUrl },
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE" },
        }],
      },
    });
  }
}

export class CountdownCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const name = interaction.data.options?.[0]?.value;
    const dateStr = interaction.data.options?.[1]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Parse date (simple: "2025-12-25" or "25/12/2025")
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return ({
        type: 4,
        data: { embeds: [this.embed.error("📅 Invalid Date", "Format: `2025-12-25` atau `25/12/2025`")], flags: 64 },
      });
    }

    const now = Date.now();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      return ({
        type: 4,
        data: { embeds: [this.embed.error("📅 Past Date", "Tanggal sudah lewat!")] },
      });
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `⏰ Countdown — ${name}`,
          description: `**Target:** ${dateStr}\n**Time Remaining:** ${days} hari ${hours} jam\n**Ends:** <t:${Math.floor(targetDate.getTime() / 1000)}:R>`,
          color: 0xe74c3c,
          footer: { text: `Created by ${userName} • RED ENGINE` },
        }],
      },
    });
  }
}