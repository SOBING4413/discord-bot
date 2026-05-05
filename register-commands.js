/**
 * 🔴 RED ENGINE v3.0 — Register ALL Slash Commands (Rate-Limit Safe)
 */

import "dotenv/config";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

const commands = [
  // 🧠 TEXT
  { name: "ask", description: "🧠 Tanya apa saja ke RED ENGINE", options: [{ name: "pertanyaan", description: "Pertanyaan kamu", type: 3, required: true, max_length: 1000 }] },
  { name: "chat", description: "💬 Chat santai dengan RED ENGINE", options: [{ name: "pesan", description: "Pesan kamu", type: 3, required: true, max_length: 1000 }] },
  { name: "translate", description: "🌐 Terjemahkan teks", options: [
    { name: "teks", description: "Teks", type: 3, required: true, max_length: 1000 },
    { name: "bahasa", description: "Bahasa tujuan", type: 3, required: false },
  ]},
  { name: "code", description: "💻 Generate kode program", options: [
    { name: "request", description: "Deskripsi kode", type: 3, required: true, max_length: 1000 },
    { name: "language", description: "Bahasa pemrograman", type: 3, required: false },
  ]},
  { name: "summarize", description: "📋 Ringkas teks", options: [
    { name: "teks", description: "Teks", type: 3, required: true, max_length: 1500 },
    { name: "format", description: "Format", type: 3, required: false, choices: [
      { name: "📋 Bullet Points", value: "bullet" }, { name: "📝 Paragraph", value: "paragraph" },
      { name: "⚡ TL;DR", value: "tldr" }, { name: "🔑 Key Points", value: "key" },
    ]},
  ]},
  { name: "explain", description: "📘 Jelaskan topik", options: [
    { name: "topik", description: "Topik", type: 3, required: true, max_length: 500 },
    { name: "level", description: "Level", type: 3, required: false, choices: [
      { name: "👶 ELI5", value: "eli5" }, { name: "🌱 Beginner", value: "beginner" },
      { name: "📘 Intermediate", value: "intermediate" }, { name: "🎓 Expert", value: "expert" },
    ]},
  ]},

  // 🎨 IMAGE
  { name: "image", description: "🎨 Generate gambar (Pony V6 XL)", options: [
    { name: "prompt", description: "Deskripsi gambar", type: 3, required: true, max_length: 1000 },
    { name: "style", description: "Style", type: 3, required: false, choices: [
      { name: "🎌 Anime", value: "anime" }, { name: "📷 Realistic", value: "realistic" }, { name: "🧙 Fantasy", value: "fantasy" },
    ]},
  ]},

  // 🎵 AUDIO
  { name: "music", description: "🎵 Generate musik (MusicGen)", options: [
    { name: "prompt", description: "Deskripsi musik", type: 3, required: true, max_length: 500 },
    { name: "duration", description: "Durasi detik (5-30)", type: 4, required: false, min_value: 5, max_value: 30 },
  ]},
  { name: "tts", description: "🗣️ Text-to-Speech", options: [
    { name: "text", description: "Teks", type: 3, required: true, max_length: 500 },
    { name: "voice", description: "Voice", type: 3, required: false },
  ]},
  { name: "transcribe", description: "📝 Audio→Text (Whisper)", options: [
    { name: "audio_url", description: "URL audio", type: 3, required: true },
  ]},

  // 👁️ VISION
  { name: "analyze", description: "👁️ Analisis gambar", options: [
    { name: "image_url", description: "URL gambar", type: 3, required: true },
    { name: "question", description: "Pertanyaan", type: 3, required: false },
  ]},
  { name: "ocr", description: "📄 Baca teks dari gambar", options: [
    { name: "image_url", description: "URL gambar", type: 3, required: true },
  ]},
  { name: "video", description: "🎬 Generate video (SVD)", options: [
    { name: "prompt", description: "Deskripsi video", type: 3, required: true, max_length: 500 },
  ]},

  // 🔍 SEARCH & INFO
  { name: "search", description: "🔍 Cari informasi", options: [{ name: "query", description: "Query", type: 3, required: true, max_length: 500 }] },
  { name: "news", description: "📰 Berita terkini", options: [{ name: "topic", description: "Topik", type: 3, required: false }] },
  { name: "weather", description: "🌤️ Info cuaca", options: [{ name: "kota", description: "Kota", type: 3, required: true }] },
  { name: "crypto", description: "💰 Harga crypto live", options: [{ name: "coin", description: "Coin name", type: 3, required: false }] },

  // 🎮 FUN & GAMES
  { name: "trivia", description: "🧠 Kuis pengetahuan", options: [
    { name: "category", description: "Kategori", type: 3, required: false, choices: [
      { name: "📚 General", value: "general" }, { name: "🔬 Science", value: "science" },
      { name: "📜 History", value: "history" }, { name: "🌍 Geography", value: "geography" },
      { name: "💻 Tech", value: "tech" }, { name: "🎌 Anime", value: "anime" }, { name: "🎮 Gaming", value: "gaming" },
    ]},
  ]},
  { name: "8ball", description: "🎱 Magic 8-Ball", options: [{ name: "question", description: "Pertanyaan", type: 3, required: true }] },
  { name: "meme", description: "😂 Random meme", options: [{ name: "topic", description: "Topik", type: 3, required: false }] },
  { name: "quiz", description: "📝 Buat kuis", options: [
    { name: "topic", description: "Topik", type: 3, required: true },
    { name: "count", description: "Jumlah soal (1-10)", type: 4, required: false, min_value: 1, max_value: 10 },
  ]},

  // 🛠️ TOOLS
  { name: "math", description: "🔢 Kalkulator + step-by-step", options: [{ name: "expression", description: "Expression", type: 3, required: true }] },
  { name: "remind", description: "⏰ Set reminder", options: [
    { name: "time", description: "Waktu (5m, 1h, 2d)", type: 3, required: true },
    { name: "message", description: "Pesan", type: 3, required: true },
  ]},
  { name: "pdf", description: "📄 Analisis PDF", options: [
    { name: "url", description: "URL PDF", type: 3, required: true },
    { name: "question", description: "Pertanyaan", type: 3, required: false },
  ]},

  // 🎭 PERSONA
  { name: "persona", description: "🎭 AI Persona System", options: [
    { name: "command", description: "Action", type: 3, required: true, choices: [
      { name: "📋 List all personas", value: "list" },
      { name: "🎭 Set persona", value: "set" },
      { name: "➕ Create custom persona", value: "create" },
      { name: "🗑️ Remove custom persona", value: "remove" },
    ]},
    { name: "name", description: "Persona name", type: 3, required: false },
    { name: "personality", description: "Personality description (for create)", type: 3, required: false },
    { name: "emoji", description: "Emoji (for create)", type: 3, required: false },
  ]},

  // 🎵 MUSIC PLAYER
  { name: "play", description: "🎵 Cari musik (YouTube/Spotify)", options: [{ name: "query", description: "Lagu/artis", type: 3, required: true }] },
  { name: "queue", description: "📋 Music queue" },

  // 🛡️ SERVER MANAGEMENT
  { name: "welcome", description: "🎉 Welcome system", options: [
    { name: "command", description: "Action", type: 3, required: true, choices: [
      { name: "✅ Setup welcome", value: "setup" },
      { name: "❌ Disable welcome", value: "disable" },
    ]},
    { name: "channel", description: "Channel ID", type: 3, required: false },
    { name: "message", description: "Welcome message ({user} = username)", type: 3, required: false },
  ]},
  { name: "purge", description: "🧹 Delete messages", options: [{ name: "amount", description: "Jumlah (1-100)", type: 4, required: true, min_value: 1, max_value: 100 }] },
  { name: "serverinfo", description: "🏠 Server info" },
  { name: "userinfo", description: "👤 User info", options: [{ name: "user", description: "User ID", type: 3, required: false }] },
  { name: "slowmode", description: "⏱️ Set slowmode", options: [{ name: "seconds", description: "Detik (0=off)", type: 4, required: true, min_value: 0, max_value: 21600 }] },

  // 🗳️ INTERACTIVE
  { name: "poll", description: "📊 Buat poll", options: [
    { name: "question", description: "Pertanyaan", type: 3, required: true },
    { name: "options", description: "Pilihan (pisah dengan |)", type: 3, required: true },
  ]},
  { name: "giveaway", description: "🎉 Buat giveaway", options: [
    { name: "prize", description: "Hadiah", type: 3, required: true },
    { name: "duration", description: "Durasi (5m, 1h, 2d)", type: 3, required: true },
    { name: "winners", description: "Jumlah pemenang", type: 4, required: false, min_value: 1, max_value: 10 },
  ]},
  { name: "ticket", description: "🎫 Support ticket", options: [
    { name: "command", description: "Action", type: 3, required: true, choices: [
      { name: "🎫 Create ticket", value: "create" },
      { name: "❌ Close ticket", value: "close" },
    ]},
    { name: "reason", description: "Alasan (untuk create)", type: 3, required: false },
  ]},

  // 📊 LEVEL SYSTEM
  { name: "level", description: "📊 Cek level & XP kamu" },
  { name: "leaderboard", description: "🏆 Level leaderboard" },

  // 🖼️ IMAGE TOOLS
  { name: "upscale", description: "🖼️ Upscale gambar (Real-ESRGAN)", options: [
    { name: "image_url", description: "URL gambar", type: 3, required: true },
    { name: "scale", description: "Scale (2 atau 4)", type: 4, required: false, choices: [
      { name: "2x", value: 2 }, { name: "4x", value: 4 },
    ]},
  ]},
  { name: "avatar", description: "🖼️ Download avatar HD", options: [{ name: "user", description: "User ID (optional)", type: 3, required: false }] },
  { name: "countdown", description: "⏰ Countdown timer", options: [
    { name: "name", description: "Nama countdown", type: 3, required: true },
    { name: "date", description: "Tanggal (2025-12-25)", type: 3, required: true },
  ]},

  // ⚙️ SETTINGS
  { name: "settings", description: "⚙️ Atur preferensi RED ENGINE" },
  { name: "stats", description: "📊 Statistik penggunaan" },
  { name: "help", description: "❓ Daftar semua command" },
];

async function registerCommands() {
  if (!DISCORD_BOT_TOKEN || !DISCORD_APPLICATION_ID) {
    console.error("❌ Missing required env vars: DISCORD_BOT_TOKEN and/or DISCORD_APPLICATION_ID");
    process.exit(1);
  }

  const url = DISCORD_GUILD_ID
    ? `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

  console.log(`🔴 RED ENGINE v3.0 — Registering ${commands.length} commands`);
  console.log(`📍 Scope: ${DISCORD_GUILD_ID ? `Guild (${DISCORD_GUILD_ID})` : "Global"}\n`);

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Discord API error ${response.status}: ${errText}`);
    }

    const registered = await response.json();
    console.log(`✅ Successfully registered ${registered.length} commands.`);
  } catch (err) {
    console.error(`❌ Command registration failed: ${err.message}`);
    process.exit(1);
  }
}

registerCommands();
