/**
 * Fun Commands — Trivia, 8Ball, Meme, Quiz
 */

const TRIVIA_CATEGORIES = {
  general: "General Knowledge",
  science: "Science",
  history: "History",
  geography: "Geography",
  tech: "Technology",
  anime: "Anime & Manga",
  gaming: "Gaming",
};

const EIGHT_BALL_RESPONSES = [
  "🟢 Ya, pasti!",
  "🟢 Tentu saja!",
  "🟢 Tanpa ragu!",
  "🟢 Bisa dipastikan!",
  "🟢 Kemungkinan besar ya!",
  "🟡 Kayaknya iya...",
  "🟡 Mungkin saja...",
  "🟡 Coba tanya lagi nanti...",
  "🟡 Belum bisa dibilang...",
  "🟡 Hmm, agak meragukan...",
  "🔴 Kurang mungkin...",
  "🔴 Kayaknya nggak...",
  "🔴 Jawabannya tidak!",
  "🔴 Jangan harap!",
  "🔴 Sangat diragukan!",
  "🔮 Tanda-tanda menunjukkan iya",
  "🔮 Konsentrasi dan tanya lagi",
  "🔮 Tidak bisa memprediksi sekarang",
];

export class TriviaCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const category = interaction.data.options?.[0]?.value || "general";
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const response = await this.ai.chat(
      `Generate a single trivia question about ${TRIVIA_CATEGORIES[category] || category}. 
Format EXACTLY like this:
**Q:** [question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
**Answer:** [letter]

Make it interesting and not too easy!`,
      `trivia_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      { systemPrompt: "You are a trivia question generator. Generate ONE question with 4 options and the correct answer. Be accurate.", maxTokens: 300 }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `🧠 Trivia — ${TRIVIA_CATEGORIES[category] || category}`,
          description: response,
          color: 0xf39c12,
          footer: { text: `For ${userName} • Dolphin AI Trivia` },
        }],
      },
    });
  }
}

export class EightBallCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const question = interaction.data.options?.[0]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";
    const answer = EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)];

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "🎱 Magic 8-Ball",
          fields: [
            { name: "❓ Question", value: question, inline: false },
            { name: "🔮 Answer", value: answer, inline: false },
          ],
          color: 0x9b59b6,
          footer: { text: `Asked by ${userName}` },
        }],
      },
    });
  }
}

export class MemeCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const topic = interaction.data.options?.[0]?.value || "";
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    try {
      // Try meme API
      const response = await fetch("https://meme-api.com/gimme" + (topic ? `/${encodeURIComponent(topic)}` : ""));
      if (response.ok) {
        const data = await response.json();
        return ({
          type: 4,
          data: {
            embeds: [{
              title: data.title || "😂 Random Meme",
              image: { url: data.url },
              color: 0xff6b6b,
              footer: { text: `r/${data.subreddit || "meme"} • For ${userName}` },
            }],
          },
        });
      }
    } catch (e) {
      console.error("Meme API error:", e);
    }

    // Fallback: AI-generated joke
    const joke = await this.ai.chat(
      "Tell me a funny meme or joke. Keep it short and hilarious.",
      `meme_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      { systemPrompt: "You are a meme expert. Tell one funny joke or meme description.", maxTokens: 200 }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: "😂 AI Meme/Joke",
          description: joke,
          color: 0xff6b6b,
          footer: { text: `For ${userName} • Dolphin AI` },
        }],
      },
    });
  }
}

export class QuizCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const topic = interaction.data.options?.[0]?.value;
    const count = interaction.data.options?.[1]?.value || 5;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const response = await this.ai.chat(
      `Create a quiz with ${count} questions about "${topic}". 
Format each question EXACTLY like:
**Q1.** [question]
A) [option]
B) [option]
C) [option]
D) [option]

At the end, provide:
**Answers:** 1-A, 2-B, etc.

Make questions progressively harder.`,
      `quiz_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      { systemPrompt: "You are a quiz generator. Create accurate, educational questions. Vary difficulty.", maxTokens: 2000 }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `📝 Quiz — ${topic}`,
          description: response,
          color: 0x2ecc71,
          footer: { text: `${count} questions • For ${userName} • Dolphin AI` },
        }],
      },
    });
  }
}