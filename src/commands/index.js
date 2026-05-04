/**
 * Command Registry — ALL 35+ Commands
 * 🔴 RED ENGINE v3.0
 * 
 * Converted: Response.json() → plain object returns for Express
 */

import { AskCommand } from "./ask.js";
import { ChatCommand } from "./chat.js";
import { TranslateCommand } from "./translate.js";
import { CodeCommand } from "./code.js";
import { SummarizeCommand } from "./summarize.js";
import { ExplainCommand } from "./explain.js";
import { ImageCommand } from "./image.js";
import { SettingsCommand } from "./settings.js";
import { HelpCommand } from "./help.js";
import { StatsCommand } from "./stats.js";
import { MusicCommand, TTSCommand, TranscribeCommand } from "./audio.js";
import { AnalyzeCommand, OCRCommand, VideoCommand } from "./vision.js";
import { SearchCommand, NewsCommand, WeatherCommand, CryptoCommand } from "./search.js";
import { TriviaCommand, EightBallCommand, MemeCommand, QuizCommand } from "./fun.js";
import { MathCommand, RemindCommand, PDFCommand } from "./tools.js";
import { PersonaCommand } from "./persona.js";
import { PlayCommand, QueueCommand } from "./music-player.js";
import { WelcomeCommand, PurgeCommand, ServerInfoCommand, UserInfoCommand, SlowmodeCommand } from "./moderation.js";
import { PollCommand, GiveawayCommand, TicketCommand } from "./interactive.js";
import { LevelCommand, LeaderboardCommand } from "./level.js";
import { UpscaleCommand, AvatarCommand, CountdownCommand } from "./image-tools.js";

export class CommandRegistry {
  constructor(ai, conversations, embedBuilder, env, logger) {
    this.ai = ai;
    this.conversations = conversations;
    this.embedBuilder = embedBuilder;
    this.env = env;
    this.logger = logger;

    this.commands = {
      // 🧠 Text AI — Dolphin 2.9.4
      ask: new AskCommand(ai, conversations, embedBuilder),
      chat: new ChatCommand(ai, conversations, embedBuilder),
      translate: new TranslateCommand(ai, conversations, embedBuilder),
      code: new CodeCommand(ai, conversations, embedBuilder),
      summarize: new SummarizeCommand(ai, conversations, embedBuilder),
      explain: new ExplainCommand(ai, conversations, embedBuilder),

      // 🎨 Image — Pony Diffusion V6 XL
      image: new ImageCommand(ai, conversations, embedBuilder, env),

      // 🎵 Audio
      music: new MusicCommand(ai, conversations, embedBuilder),
      tts: new TTSCommand(ai, conversations, embedBuilder),
      transcribe: new TranscribeCommand(ai, conversations, embedBuilder),

      // 👁️ Vision
      analyze: new AnalyzeCommand(ai, conversations, embedBuilder),
      ocr: new OCRCommand(ai, conversations, embedBuilder),
      video: new VideoCommand(ai, conversations, embedBuilder),

      // 🔍 Search & Info
      search: new SearchCommand(ai, conversations, embedBuilder),
      news: new NewsCommand(ai, conversations, embedBuilder),
      weather: new WeatherCommand(ai, conversations, embedBuilder),
      crypto: new CryptoCommand(ai, conversations, embedBuilder, env),

      // 🎮 Fun & Games
      trivia: new TriviaCommand(ai, conversations, embedBuilder),
      "8ball": new EightBallCommand(ai, conversations, embedBuilder),
      meme: new MemeCommand(ai, conversations, embedBuilder),
      quiz: new QuizCommand(ai, conversations, embedBuilder),

      // 🛠️ Tools
      math: new MathCommand(ai, conversations, embedBuilder),
      remind: new RemindCommand(ai, conversations, embedBuilder, env),
      pdf: new PDFCommand(ai, conversations, embedBuilder),

      // 🎭 Persona System
      persona: new PersonaCommand(ai, conversations, embedBuilder),

      // 🎵 Music Player
      play: new PlayCommand(ai, conversations, embedBuilder, env),
      queue: new QueueCommand(ai, conversations, embedBuilder),

      // 🛡️ Server Management
      welcome: new WelcomeCommand(ai, conversations, embedBuilder, env),
      purge: new PurgeCommand(ai, conversations, embedBuilder),
      serverinfo: new ServerInfoCommand(ai, conversations, embedBuilder),
      userinfo: new UserInfoCommand(ai, conversations, embedBuilder),
      slowmode: new SlowmodeCommand(ai, conversations, embedBuilder),

      // 🗳️ Interactive
      poll: new PollCommand(ai, conversations, embedBuilder),
      giveaway: new GiveawayCommand(ai, conversations, embedBuilder, env),
      ticket: new TicketCommand(ai, conversations, embedBuilder, env),

      // 📊 Level System
      level: new LevelCommand(ai, conversations, embedBuilder, env),
      leaderboard: new LeaderboardCommand(ai, conversations, embedBuilder, env),

      // 🖼️ Image Tools
      upscale: new UpscaleCommand(ai, conversations, embedBuilder),
      avatar: new AvatarCommand(ai, conversations, embedBuilder),
      countdown: new CountdownCommand(ai, conversations, embedBuilder, env),

      // ⚙️ Settings
      settings: new SettingsCommand(ai, conversations, embedBuilder, env),
      help: new HelpCommand(embedBuilder),
      stats: new StatsCommand(ai, conversations, embedBuilder, env),
    };
  }

  async handle(interaction) {
    const commandName = interaction.data.name.toLowerCase();
    const command = this.commands[commandName];

    if (!command) {
      return {
        type: 4,
        data: {
          embeds: [this.embedBuilder.error("Unknown Command", `Command \`/${commandName}\` not found. Use \`/help\` for available commands.`)],
        },
      };
    }

    try {
      this.logger.info(`Command: /${commandName} by ${interaction.member?.user?.username || "unknown"}`);

      // Add XP for using commands
      const levelCmd = this.commands.level;
      if (levelCmd && levelCmd.addXP) {
        const userId = interaction.member?.user?.id || interaction.user?.id;
        await levelCmd.addXP(userId, 5);
      }

      return await command.execute(interaction);
    } catch (error) {
      this.logger.error(`Command error: /${commandName}`, error);
      return {
        type: 4,
        data: {
          embeds: [this.embedBuilder.error("Error", "An unexpected error occurred. Please try again later.")],
          flags: 64,
        },
      };
    }
  }
}