export class CodeCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.conversations = conversations;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const request = interaction.data.options?.[0]?.value;
    const language = interaction.data.options?.[1]?.value || null;
    const userId = interaction.member?.user?.id || interaction.user?.id;

    const langInstruction = language ? `Use ${language} programming language.` : "Choose the most appropriate programming language.";
    const prompt = `${langInstruction}

Write clean, production-ready code for the following request:
${request}

Include:
1. Code with clear comments
2. Brief explanation of the approach
3. Example usage if applicable`;

    const response = await this.ai.chat(prompt, `code_${userId}`, userId, {
      model: "gpt-4o-mini",
      systemPrompt: `You are an expert software engineer. Write clean, efficient, well-documented code.
Always use markdown code blocks with the appropriate language tag.
Follow best practices and design patterns.
Include error handling where appropriate.`,
      history: [],
      maxTokens: 2000,
    });

    return ({
      type: 4,
      data: {
        embeds: [this.embed.codeResponse(request, response)],
      },
    });
  }
}