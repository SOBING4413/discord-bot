/**
 * Embed Builder — RED ENGINE Branding
 */

export class EmbedBuilder {
  static COLORS = {
    PRIMARY: 0xe74c3c,    // 🔴 RED ENGINE
    SUCCESS: 0x57f287,
    WARNING: 0xfee75c,
    ERROR: 0xed4245,
    INFO: 0x00b4d8,
    AI: 0xc0392b,         // 🔴 Dark Red
    CODE: 0x2ecc71,
    TRANSLATE: 0x3498db,
    CHAT: 0xe74c3c,
    MUSIC: 0x9b59b6,
    VISION: 0xe67e22,
  };

  static FOOTER = "🔴 RED ENGINE • Railway";
  static LIMITS = {
    TITLE: 256,
    DESCRIPTION: 4096,
    FIELD_VALUE: 1024,
  };

  _safeText(value, max = EmbedBuilder.LIMITS.DESCRIPTION) {
    const text = String(value ?? "");
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 1))}…`;
  }

  aiResponse(userName, question, answer) {
    return {
      title: "🔴 RED ENGINE",
      description: `**${userName}** asked:\n> ${question.substring(0, 200)}\n\n${answer}`,
      color: EmbedBuilder.COLORS.AI,
      footer: { text: EmbedBuilder.FOOTER },
      timestamp: new Date().toISOString(),
    };
  }

  chatResponse(userName, message, response) {
    return {
      title: "💬 RED ENGINE Chat",
      description: `**${userName}**: ${message.substring(0, 200)}\n\n🔴 **RED ENGINE**: ${response}`,
      color: EmbedBuilder.COLORS.CHAT,
      footer: { text: EmbedBuilder.FOOTER },
      timestamp: new Date().toISOString(),
    };
  }

  translation(original, translated, targetLang) {
    return {
      title: `🌐 Translation → ${targetLang}`,
      fields: [
        { name: "📝 Original", value: original.substring(0, 1024), inline: false },
        { name: `✅ ${targetLang}`, value: translated.substring(0, 1024), inline: false },
      ],
      color: EmbedBuilder.COLORS.TRANSLATE,
      footer: { text: EmbedBuilder.FOOTER },
      timestamp: new Date().toISOString(),
    };
  }

  codeResponse(request, code) {
    const safeRequest = this._safeText(request, 200);
    const header = `**Request:** ${safeRequest}\n\n`;
    const maxCodeLength = Math.max(0, EmbedBuilder.LIMITS.DESCRIPTION - header.length);
    const safeCode = this._safeText(code, maxCodeLength);
    return {
      title: "💻 Code Generated — RED ENGINE",
      description: `${header}${safeCode}`,
      color: EmbedBuilder.COLORS.CODE,
      footer: { text: EmbedBuilder.FOOTER },
      timestamp: new Date().toISOString(),
    };
  }

  summaryResponse(originalText, summary, format) {
    const formatEmoji = { bullet: "📋", paragraph: "📝", tldr: "⚡", key: "🔑" };
    return {
      title: `${formatEmoji[format] || "📋"} Summary (${format})`,
      description: summary,
      color: EmbedBuilder.COLORS.INFO,
      footer: { text: EmbedBuilder.FOOTER },
      timestamp: new Date().toISOString(),
    };
  }

  explainResponse(topic, explanation, level) {
    const levelEmoji = { beginner: "🌱", intermediate: "📘", expert: "🎓", eli5: "👶" };
    return {
      title: `${levelEmoji[level] || "📘"} Explaining: ${topic}`,
      description: explanation,
      color: EmbedBuilder.COLORS.PRIMARY,
      footer: { text: `Level: ${level} • RED ENGINE` },
      timestamp: new Date().toISOString(),
    };
  }

  success(title, description) {
    return { title, description, color: EmbedBuilder.COLORS.SUCCESS, timestamp: new Date().toISOString() };
  }

  warning(title, description) {
    return { title, description, color: EmbedBuilder.COLORS.WARNING, timestamp: new Date().toISOString() };
  }

  error(title, description) {
    return { title, description, color: EmbedBuilder.COLORS.ERROR, timestamp: new Date().toISOString() };
  }
}
