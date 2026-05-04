export class ExplainCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const topic = interaction.data.options?.[0]?.value;
    const level = interaction.data.options?.[1]?.value || "intermediate";
    const userId = interaction.member?.user?.id || interaction.user?.id;

    const levelInstructions = {
      beginner: "Explain as if the person has no prior knowledge. Use simple analogies and avoid jargon.",
      intermediate: "Explain with moderate detail. Assume basic familiarity with the topic.",
      expert: "Provide a deep, technical explanation with advanced concepts and nuances.",
      eli5: "Explain Like I'm 5 — use very simple words and fun analogies a child would understand.",
    };

    const prompt = `Explain the following topic: ${topic}

Level: ${level}
${levelInstructions[level] || levelInstructions.intermediate}

Include:
1. Clear definition
2. Key concepts
3. Real-world examples
4. Common misconceptions (if any)`;

    const response = await this.ai.chat(prompt, `explain_${userId}`, userId, {
      model: "gpt-4o-mini",
      systemPrompt: "You are an expert educator. Explain concepts clearly and thoroughly. Use examples and analogies. Respond in Bahasa Indonesia unless the topic is in English.",
      history: [],
      maxTokens: 2000,
    });

    return ({
      type: 4,
      data: {
        embeds: [this.embed.explainResponse(topic, response, level)],
      },
    });
  }
}