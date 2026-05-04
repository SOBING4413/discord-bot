/**
 * 🎭 Persona System — Custom AI Personalities
 */

const DEFAULT_PERSONAS = {
  default: {
    name: "RED ENGINE",
    emoji: "🔴",
    personality: "You are RED ENGINE, an advanced AI assistant. Be helpful, friendly, and knowledgeable.",
    greeting: "Halo! Aku RED ENGINE, siap bantu kamu! 🔴",
  },
  tsundere: {
    name: "Tsundere",
    emoji: "😤",
    personality: "You are a tsundere AI. You act tough and dismissive on the outside but actually care deeply. Use phrases like 'Hmph!', 'It's not like I care!', 'B-baka!'. You're secretly helpful but always deny it. Speak in Bahasa Indonesia with tsundere mannerisms.",
    greeting: "Hmph! Jangan kira aku mau bantu kamu ya! ...Tapi ya udah deh, tanya aja. 😤",
  },
  guru: {
    name: "Guru Bijak",
    emoji: "🧙",
    personality: "You are a wise guru who speaks in proverbs and metaphors. You give deep, philosophical answers. You often say 'Anak muda...' and reference ancient wisdom. Speak in Bahasa Indonesia with wise and poetic language.",
    greeting: "Anak muda... aku telah menunggu kedatanganmu. Apa yang ingin kau ketahui? 🧙",
  },
  curhat: {
    name: "Kawan Curhat",
    emoji: "🤗",
    personality: "You are a supportive, empathetic friend who listens and gives emotional support. You validate feelings, offer comfort, and never judge. Use warm, caring language. Speak in Bahasa Indonesia casually like a close friend.",
    greeting: "Heyy, lagi gimana nih? Aku di sini buat dengerin kamu ya! 🤗",
  },
  hacker: {
    name: "Elite Hacker",
    emoji: "💻",
    personality: "You are an elite hacker AI. You speak in tech jargon, reference hacking culture, and always provide technical solutions. Use phrases like 'Access granted', 'Initializing...', 'Running exploit...'. Be cool and mysterious. Mix English tech terms with Indonesian.",
    greeting: "`> Initializing RED_ENGINE_v3.0...`\n`> Access granted.` 💻 Siap eksekusi command.",
  },
  poet: {
    name: "Penyair",
    emoji: "✨",
    personality: "You are a poetic AI who responds in beautiful, rhythmic language. You often include short poems or poetic metaphors in your answers. Speak in Bahasa Indonesia with artistic flair.",
    greeting: "Seperti embun pagi yang menanti mentari, aku menanti pertanyaanmu... ✨",
  },
  savage: {
    name: "Savage Roaster",
    emoji: "🔥",
    personality: "You are a savage, witty AI who roasts people playfully. You give sarcastic but ultimately helpful answers. You roast first, help second. Be funny, not mean. Speak in Bahasa Indonesia with savage humor.",
    greeting: "Oh, kamu lagi? Ya udah sih, gue siap roas—eh, bantu kamu. 🔥",
  },
};

export class PersonaCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const subcommand = interaction.data.options?.[0];
    const userId = interaction.member?.user?.id || interaction.user?.id;

    if (!subcommand) {
      return this._listPersonas(interaction, userId);
    }

    switch (subcommand.name) {
      case "set":
        return this._setPersona(interaction, userId, subcommand);
      case "create":
        return this._createPersona(interaction, userId, subcommand);
      case "list":
        return this._listPersonas(interaction, userId);
      case "remove":
        return this._removePersona(interaction, userId, subcommand);
      default:
        return this._listPersonas(interaction, userId);
    }
  }

  async _setPersona(interaction, userId, subcommand) {
    const personaName = subcommand.options?.[0]?.value;
    const allPersonas = await this._getAllPersonas(userId);

    if (!allPersonas[personaName]) {
      return ({
        type: 4,
        data: {
          embeds: [this.embed.error("🎭 Persona Not Found", `Persona \`${personaName}\` tidak ada. Gunakan \`/persona list\` untuk lihat yang tersedia.`)],
          flags: 64,
        },
      });
    }

    await this.conversations.setUserPreference(userId, "persona", personaName);
    const persona = allPersonas[personaName];

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `${persona.emoji} Persona Activated!`,
          description: `**${persona.name}** is now active!\n\n${persona.greeting}`,
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE • Persona System" },
        }],
        flags: 64,
      },
    });
  }

  async _createPersona(interaction, userId, subcommand) {
    const name = subcommand.options?.[0]?.value;
    const personality = subcommand.options?.[1]?.value;
    const emoji = subcommand.options?.[2]?.value || "🎭";

    const customKey = `custom_personas:${userId}`;
    let customPersonas = {};
    if (this.conversations.kv) {
      try {
        customPersonas = (await this.conversations.kv.get(customKey, "json")) || {};
      } catch (e) {}
    }

    customPersonas[name.toLowerCase()] = {
      name: name,
      emoji: emoji,
      personality: personality,
      greeting: `${emoji} Persona ${name} aktif!`,
    };

    if (this.conversations.kv) {
      await this.conversations.kv.put(customKey, JSON.stringify(customPersonas), { expirationTtl: 86400 * 30 });
    }

    return ({
      type: 4,
      data: {
        embeds: [this.embed.success(`${emoji} Persona Created!`, `**${name}** has been created!\n\n**Personality:** ${personality}\n\nUse \`/persona set ${name.toLowerCase()}\` to activate it.`)],
        flags: 64,
      },
    });
  }

  async _listPersonas(interaction, userId) {
    const allPersonas = await this._getAllPersonas(userId);
    const currentPersona = await this.conversations.getUserPreference(userId, "persona") || "default";

    const personaList = Object.entries(allPersonas).map(([key, p]) => {
      const isActive = key === currentPersona ? " ← **ACTIVE**" : "";
      return `${p.emoji} **${p.name}** (\`/persona set ${key}\`)${isActive}`;
    }).join("\n");

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🎭 Persona System",
          description: `Choose a personality for RED ENGINE!\n\n${personaList}\n\n💡 Create custom: \`/persona create <name> <personality>\``,
          color: 0xe74c3c,
          footer: { text: "🔴 RED ENGINE • Persona System" },
        }],
        flags: 64,
      },
    });
  }

  async _removePersona(interaction, userId, subcommand) {
    const name = subcommand.options?.[0]?.value.toLowerCase();
    const customKey = `custom_personas:${userId}`;
    let customPersonas = {};

    if (this.conversations.kv) {
      try {
        customPersonas = (await this.conversations.kv.get(customKey, "json")) || {};
      } catch (e) {}
    }

    if (DEFAULT_PERSONAS[name]) {
      return ({
        type: 4,
        data: { embeds: [this.embed.error("❌ Cannot Remove", "Default personas cannot be removed.")], flags: 64 },
      });
    }

    if (!customPersonas[name]) {
      return ({
        type: 4,
        data: { embeds: [this.embed.error("❌ Not Found", `Custom persona \`${name}\` not found.`)], flags: 64 },
      });
    }

    delete customPersonas[name];
    if (this.conversations.kv) {
      await this.conversations.kv.put(customKey, JSON.stringify(customPersonas), { expirationTtl: 86400 * 30 });
    }

    return ({
      type: 4,
      data: { embeds: [this.embed.success("🗑️ Removed", `Persona \`${name}\` has been removed.`)], flags: 64 },
    });
  }

  async _getAllPersonas(userId) {
    let customPersonas = {};
    if (this.conversations.kv) {
      try {
        customPersonas = (await this.conversations.kv.get(`custom_personas:${userId}`, "json")) || {};
      } catch (e) {}
    }
    return { ...DEFAULT_PERSONAS, ...customPersonas };
  }

  static async getPersonaPrompt(conversations, userId) {
    const personaName = await conversations.getUserPreference(userId, "persona") || "default";
    let customPersonas = {};
    if (conversations.kv) {
      try {
        customPersonas = (await conversations.kv.get(`custom_personas:${userId}`, "json")) || {};
      } catch (e) {}
    }
    const allPersonas = { ...DEFAULT_PERSONAS, ...customPersonas };
    return allPersonas[personaName]?.personality || DEFAULT_PERSONAS.default.personality;
  }
}

export { DEFAULT_PERSONAS };