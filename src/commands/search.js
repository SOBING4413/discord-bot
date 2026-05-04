/**
 * Search Commands — Web Search, News, Weather, Crypto
 */

export class SearchCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const query = interaction.data.options?.[0]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Use AI with search-optimized prompt
    const response = await this.ai.chat(
      `Search and provide the most up-to-date information about: ${query}. Include facts, details, and sources if possible.`,
      `search_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      {
        systemPrompt: "You are a search assistant. Provide accurate, up-to-date information. If you're unsure about current data, say so. Format results clearly with bullet points.",
        provider: "groq",
      }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `🔍 Search: ${query.substring(0, 100)}`,
          description: response,
          color: 0x4285f4,
          footer: { text: `Searched by ${userName} • Dolphin AI` },
        }],
      },
    });
  }
}

export class NewsCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const topic = interaction.data.options?.[0]?.value || "general";
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    const response = await this.ai.chat(
      `Give me the latest news summary about: ${topic}. Provide key headlines and brief summaries.`,
      `news_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      {
        systemPrompt: "You are a news assistant. Provide news summaries in a clear, structured format with headlines and brief descriptions. Note that your knowledge has a cutoff date and you may not have the very latest news.",
        provider: "groq",
      }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `📰 News: ${topic}`,
          description: response,
          color: 0x1a73e8,
          footer: { text: `Requested by ${userName} • AI News Summary` },
        }],
      },
    });
  }
}

export class WeatherCommand {
  constructor(ai, conversations, embedBuilder) {
    this.ai = ai;
    this.embed = embedBuilder;
  }

  async execute(interaction) {
    const city = interaction.data.options?.[0]?.value;
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    // Try OpenWeatherMap free API if key exists
    const weatherKey = this.env?.OPENWEATHER_API_KEY;
    if (weatherKey) {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherKey}&units=metric`
        );
        if (response.ok) {
          const data = await response.json();
          return ({
            type: 4,
            data: {
              embeds: [{
                title: `🌤️ Weather — ${data.name}, ${data.sys.country}`,
                fields: [
                  { name: "🌡️ Temperature", value: `${Math.round(data.main.temp)}°C (feels like ${Math.round(data.main.feels_like)}°C)`, inline: true },
                  { name: "💧 Humidity", value: `${data.main.humidity}%`, inline: true },
                  { name: "💨 Wind", value: `${data.wind.speed} m/s`, inline: true },
                  { name: "☁️ Condition", value: data.weather[0].description, inline: true },
                  { name: "📊 Pressure", value: `${data.main.pressure} hPa`, inline: true },
                  { name: "👁️ Visibility", value: `${data.visibility / 1000} km`, inline: true },
                ],
                color: 0x00b4d8,
                footer: { text: `Requested by ${userName} • OpenWeatherMap` },
              }],
            },
          });
        }
      } catch (e) {
        console.error("Weather API error:", e);
      }
    }

    // Fallback: AI-based weather info
    const response = await this.ai.chat(
      `What is the typical current weather in ${city}? Provide general climate information.`,
      `weather_${interaction.member?.user?.id}`,
      interaction.member?.user?.id,
      { systemPrompt: "Provide general weather/climate info. Note you don't have real-time data." }
    );

    return ({
      type: 4,
      data: {
        embeds: [{
          title: `🌤️ Weather — ${city}`,
          description: response + "\n\n⚠️ *Data dari AI, bukan real-time. Tambahkan OPENWEATHER_API_KEY untuk data live.*",
          color: 0x00b4d8,
          footer: { text: `Requested by ${userName}` },
        }],
      },
    });
  }
}

export class CryptoCommand {
  constructor(ai, conversations, embedBuilder, env) {
    this.ai = ai;
    this.embed = embedBuilder;
    this.env = env;
  }

  async execute(interaction) {
    const coin = (interaction.data.options?.[0]?.value || "bitcoin").toLowerCase();
    const userName = interaction.member?.user?.global_name || interaction.member?.user?.username || "User";

    try {
      // Free CoinGecko API — no key needed
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,idr&include_24hr_change=true&include_market_cap=true`
      );

      if (response.ok) {
        const data = await response.json();
        const coinData = data[coin];

        if (coinData) {
          return ({
            type: 4,
            data: {
              embeds: [{
                title: `💰 ${coin.toUpperCase()} Price`,
                fields: [
                  { name: "💵 USD", value: `$${coinData.usd?.toLocaleString() || "N/A"}`, inline: true },
                  { name: "🇮🇩 IDR", value: `Rp ${coinData.idr?.toLocaleString() || "N/A"}`, inline: true },
                  { name: "📈 24h Change", value: `${coinData.usd_24h_change?.toFixed(2) || "N/A"}%`, inline: true },
                  { name: "🏦 Market Cap", value: `$${coinData.usd_market_cap ? (coinData.usd_market_cap / 1e9).toFixed(2) + "B" : "N/A"}`, inline: true },
                ],
                color: coinData.usd_24h_change >= 0 ? 0x57f287 : 0xed4245,
                footer: { text: `Requested by ${userName} • CoinGecko` },
              }],
            },
          });
        }
      }
    } catch (e) {
      console.error("Crypto API error:", e);
    }

    return ({
      type: 4,
      data: {
        embeds: [this.embed.error("💰 Crypto Lookup Failed", `Could not find price for **${coin}**. Try: bitcoin, ethereum, solana, etc.`)],
      },
    });
  }
}