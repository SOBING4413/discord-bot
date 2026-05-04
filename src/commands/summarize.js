export class SummarizeCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const text = interaction.data.options?.[0]?.value;
    const format = interaction.data.options?.[1]?.value || "bullet";
    const userId = interaction.member?.user?.id || interaction.user?.id;

    const formatInstructions = {
      bullet: "Use bullet points for the summary.",
      paragraph: "Write a concise paragraph summary.",
      tldr: "Write a one-line TL;DR summary.",
      key: "Extract key points and takeaways.",
    };

    const prompt = `Summarize the following text. ${formatInstructions[format] || formatInstructions.bullet}

Text:
${text}`;

    const response = await this.ai.chat(prompt, `summarize_${userId}`, userId, {
      model: "gpt-4o-mini",
      systemPrompt: "You are an expert at summarizing content. Be concise, accurate, and capture the key points. Respond in the same language as the input text.",
      history: [],
    });

    return ({
      type: 4,
      data: {
        embeds: [this.embed.summaryResponse(text, response, format)],
      },
    });
  }
}