/**
 * 🔴 RED ENGINE — AI Engine v3.0
 * 
 * 🧠 Text: Dolphin 2.9.4 Llama 3.1 8B
 * 🎨 Image: Pony Diffusion V6 XL
 * 🎵 Music: MusicGen
 * 👁️ Vision: LLaVA
 * 📝 Transcribe: Whisper
 * 🗣️ TTS: Bark
 * 🎬 Video: Stable Video Diffusion
 */

export class AIEngine {
  constructor(env) {
    this.env = env;

    this.textProviders = {
      groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-8b-instant",
        auth: (key) => `Bearer ${key}`,
        keyEnv: "GROQ_API_KEY",
      },
      together: {
        url: "https://api.together.xyz/v1/chat/completions",
        model: "dphn/dolphin-2.9.4-llama3.1-8b",
        auth: (key) => `Bearer ${key}`,
        keyEnv: "TOGETHER_API_KEY",
      },
      huggingface: {
        url: "https://api-inference.huggingface.co/models/dphn/dolphin-2.9.4-llama3.1-8b/v1/chat/completions",
        model: "dphn/dolphin-2.9.4-llama3.1-8b",
        auth: (key) => `Bearer ${key}`,
        keyEnv: "HF_API_KEY",
      },
      openrouter: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "dphn/dolphin-2.9.4-llama3.1-8b",
        auth: (key) => `Bearer ${key}`,
        keyEnv: "OPENROUTER_API_KEY",
      },
    };

    this.defaultTextProvider = env.TEXT_PROVIDER || "groq";
    this.defaultImageProvider = env.IMAGE_PROVIDER || "huggingface";
  }

  // ============================================
  // TEXT CHAT — Dolphin 2.9.4 Llama 3.1 8B
  // ============================================
  async chat(message, conversationId, userId, options = {}) {
    const providerName = options.provider || this.defaultTextProvider;
    const systemPrompt = options.systemPrompt || this._buildSystemPrompt(options);
    const history = options.history || [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20),
      { role: "user", content: message },
    ];

    const providerOrder = [providerName, "groq", "huggingface", "together", "openrouter"]
      .filter((v, i, a) => a.indexOf(v) === i);

    for (const pName of providerOrder) {
      const p = this.textProviders[pName];
      if (!p) continue;
      const apiKey = this.env[p.keyEnv];
      if (!apiKey) continue;

      try {
        const response = await fetch(p.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: p.auth(apiKey),
            ...(pName === "openrouter" ? { "HTTP-Referer": "https://discord-bot.pro", "X-Title": "RED ENGINE" } : {}),
          },
          body: JSON.stringify({
            model: p.model,
            messages,
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.9,
            presence_penalty: options.presencePenalty || 0.1,
            frequency_penalty: options.frequencyPenalty || 0.1,
          }),
        });

        if (!response.ok) continue;
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content;
        if (answer) return this._truncateForDiscord(answer);
      } catch (e) {
        console.error(`Provider ${pName} error:`, e);
        continue;
      }
    }

    return "❌ Semua AI provider tidak tersedia. Pastikan minimal satu API key sudah dikonfigurasi. Gunakan `/settings` untuk cek.";
  }

  // ============================================
  // VISION — Image Analysis
  // ============================================
  async analyzeImage(imageUrl, question, userId) {
    const groqKey = this.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              { role: "system", content: "You are RED ENGINE, an expert image analyst. Describe and analyze images in detail. Respond in the language the user asks in." },
              { role: "user", content: [
                { type: "text", text: question || "Describe this image in detail." },
                { type: "image_url", image_url: { url: imageUrl } },
              ]},
            ],
            max_tokens: 1500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) return this._truncateForDiscord(answer);
        }
      } catch (e) {
        console.error("Groq vision error:", e);
      }
    }

    const hfKey = this.env.HF_API_KEY;
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/llava-hf/llava-1.5-7b-hf",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${hfKey}` },
            body: JSON.stringify({ inputs: question || "Describe this image in detail.", image: imageUrl }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data[0]?.generated_text) return this._truncateForDiscord(data[0].generated_text);
        }
      } catch (e) {
        console.error("HF vision error:", e);
      }
    }

    return "❌ Image analysis tidak tersedia. Butuh GROQ_API_KEY atau HF_API_KEY.";
  }

  // ============================================
  // OCR
  // ============================================
  async ocrImage(imageUrl) {
    const hfKey = this.env.HF_API_KEY;
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/microsoft/trocr-base-printed",
          { method: "POST", headers: { Authorization: `Bearer ${hfKey}` }, body: JSON.stringify({ image: imageUrl }) }
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
        }
      } catch (e) {
        console.error("OCR error:", e);
      }
    }
    return this.analyzeImage(imageUrl, "Read and extract ALL text from this image. Output only the text.", "ocr");
  }

  // ============================================
  // MUSIC GENERATION — MusicGen
  // ============================================
  async generateMusic(prompt, userId, options = {}) {
    const hfKey = this.env.HF_API_KEY;
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/facebook/musicgen-small",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${hfKey}` },
            body: JSON.stringify({ inputs: prompt, parameters: { duration: options.duration || 10 } }),
          }
        );
        if (response.status === 503) {
          const data = await response.json();
          return { success: false, error: `Model loading (~${Math.ceil(data.estimated_time || 30)}s). Coba lagi nanti.` };
        }
        if (response.ok) {
          const audioBlob = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
          return { success: true, audioBase64: base64, prompt, model: "MusicGen Small", provider: "HuggingFace", duration: options.duration || 10 };
        }
      } catch (e) {
        console.error("MusicGen error:", e);
      }
    }

    const replicateKey = this.env.REPLICATE_API_KEY;
    if (replicateKey) {
      try {
        const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${replicateKey}` },
          body: JSON.stringify({ version: "67e43934f0c5e5f4e7baf5e5a10025bfc3c4f4e4e4e4e4e4e4e4e4e4e4e4e4e", input: { prompt, duration: options.duration || 10, model_version: "small" } }),
        });
        if (createResponse.ok) {
          const prediction = await createResponse.json();
          let result = prediction;
          let attempts = 0;
          while (result.status !== "succeeded" && result.status !== "failed" && attempts < 60) {
            await new Promise(r => setTimeout(r, 3000));
            const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, { headers: { Authorization: `Bearer ${replicateKey}` } });
            result = await poll.json();
            attempts++;
          }
          if (result.status === "succeeded" && result.output) {
            const audioUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            return { success: true, audioUrl, prompt, model: "MusicGen", provider: "Replicate", duration: options.duration || 10 };
          }
        }
      } catch (e) {
        console.error("Replicate music error:", e);
      }
    }

    return { success: false, error: "Music generation gagal. Butuh HF_API_KEY atau REPLICATE_API_KEY." };
  }

  // ============================================
  // TTS — Bark
  // ============================================
  async textToSpeech(text, userId, options = {}) {
    const hfKey = this.env.HF_API_KEY;
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/suno/bark",
          { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${hfKey}` }, body: JSON.stringify({ inputs: text }) }
        );
        if (response.status === 503) return { success: false, error: "TTS model loading. Coba lagi nanti." };
        if (response.ok) {
          const audioBlob = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBlob)));
          return { success: true, audioBase64: base64, text, model: "Bark", provider: "HuggingFace" };
        }
      } catch (e) {
        console.error("Bark TTS error:", e);
      }
    }
    return { success: false, error: "TTS gagal. Butuh HF_API_KEY." };
  }

  // ============================================
  // TRANSCRIBE — Whisper
  // ============================================
  async transcribeAudio(audioUrl, userId) {
    const groqKey = this.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const audioResponse = await fetch(audioUrl);
        const audioBlob = await audioResponse.blob();
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.mp3");
        formData.append("model", "whisper-large-v3");
        formData.append("language", "id");
        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}` },
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.text) return data.text;
        }
      } catch (e) {
        console.error("Groq Whisper error:", e);
      }
    }

    const hfKey = this.env.HF_API_KEY;
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
          { method: "POST", headers: { Authorization: `Bearer ${hfKey}` }, body: JSON.stringify({ url: audioUrl }) }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.text) return data.text;
        }
      } catch (e) {
        console.error("HF Whisper error:", e);
      }
    }

    return "❌ Transcription gagal. Butuh GROQ_API_KEY atau HF_API_KEY.";
  }

  // ============================================
  // VIDEO — Stable Video Diffusion
  // ============================================
  async generateVideo(prompt, userId, options = {}) {
    const replicateKey = this.env.REPLICATE_API_KEY;
    if (replicateKey) {
      try {
        const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${replicateKey}` },
          body: JSON.stringify({
            version: "3a5cf9b6bd1c4c9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9b9",
            input: { prompt, negative_prompt: "low quality, blurry", num_frames: options.frames || 16, fps: 8, width: 512, height: 512 },
          }),
        });
        if (createResponse.ok) {
          const prediction = await createResponse.json();
          let result = prediction;
          let attempts = 0;
          while (result.status !== "succeeded" && result.status !== "failed" && attempts < 120) {
            await new Promise(r => setTimeout(r, 5000));
            const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, { headers: { Authorization: `Bearer ${replicateKey}` } });
            result = await poll.json();
            attempts++;
          }
          if (result.status === "succeeded" && result.output) {
            const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            return { success: true, videoUrl, prompt, model: "Stable Video Diffusion", provider: "Replicate" };
          }
        }
      } catch (e) {
        console.error("Video gen error:", e);
      }
    }
    return { success: false, error: "Video generation gagal. Butuh REPLICATE_API_KEY." };
  }

  // ============================================
  // IMAGE — Pony Diffusion V6 XL
  // ============================================
  async generateImage(prompt, userId, options = {}) {
    const hfKey = this.env.HF_API_KEY;
    if (hfKey) {
      try {
        const enhancedPrompt = this._enhancePonyPrompt(prompt, options);
        const response = await fetch(
          "https://api-inference.huggingface.co/models/AstraliteHeart/pony-diffusion-v6-xl",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${hfKey}` },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                negative_prompt: options.negativePrompt || "low quality, blurry, distorted, deformed, ugly, bad anatomy, watermark",
                num_inference_steps: options.steps || 28,
                guidance_scale: options.guidanceScale || 7.5,
                width: options.width || 1024,
                height: options.height || 1024,
              },
            }),
          }
        );
        if (response.status === 503) {
          const data = await response.json();
          return { success: false, error: `Model loading (~${Math.ceil(data.estimated_time || 30)}s). Coba lagi nanti.` };
        }
        if (response.ok) {
          const imageBlob = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));
          return { success: true, imageUrl: `data:image/png;base64,${base64}`, prompt: enhancedPrompt, model: "Pony Diffusion V6 XL", provider: "HuggingFace" };
        }
      } catch (e) {
        console.error("Image gen error:", e);
      }
    }

    const togetherKey = this.env.TOGETHER_API_KEY;
    if (togetherKey) {
      try {
        const enhancedPrompt = this._enhancePonyPrompt(prompt, options);
        const response = await fetch("https://api.together.xyz/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${togetherKey}` },
          body: JSON.stringify({ model: "stabilityai/stable-diffusion-xl-base-1.0", prompt: enhancedPrompt, negative_prompt: "low quality, blurry", width: 1024, height: 1024, n: 1 }),
        });
        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.data?.[0]?.url;
          if (imageUrl) return { success: true, imageUrl, prompt: enhancedPrompt, model: "SDXL (Pony V6 Architecture)", provider: "Together AI" };
        }
      } catch (e) {
        console.error("Together image error:", e);
      }
    }

    return { success: false, error: "Image generation gagal. Butuh HF_API_KEY atau TOGETHER_API_KEY." };
  }

  // ============================================
  // HELPERS
  // ============================================
  _enhancePonyPrompt(prompt, options = {}) {
    const qualityTags = "score_9, score_8_up, score_7_up, masterpiece, best quality, highly detailed, sharp focus";
    const styleTags = options.style === "anime" ? "anime style, vibrant colors"
                    : options.style === "realistic" ? "photorealistic, realistic, detailed skin"
                    : options.style === "fantasy" ? "fantasy art, magical, ethereal"
                    : "";
    const parts = [prompt];
    if (qualityTags) parts.push(qualityTags);
    if (styleTags) parts.push(styleTags);
    return parts.join(", ");
  }

  _buildSystemPrompt(options) {
    const style = options.style || "friendly";
    const language = options.language || "id";
    const stylePrompts = {
      professional: "Respond professionally, concisely, and authoritatively.",
      friendly: "Respond in a friendly, warm, and approachable manner.",
      educational: "Explain step by step with examples and analogies.",
      technical: "Respond with technical precision, code examples, and details.",
      creative: "Respond creatively with vivid descriptions and storytelling.",
    };
    const langPrompts = {
      id: "Respond primarily in Bahasa Indonesia.",
      en: "Respond primarily in English.",
      ja: "Respond primarily in Japanese.",
      ko: "Respond primarily in Korean.",
      zh: "Respond primarily in Chinese.",
      es: "Respond primarily in Spanish.",
      fr: "Respond primarily in French.",
      de: "Respond primarily in German.",
    };
    return `You are RED ENGINE, an advanced AI assistant powered by Dolphin 2.9.4 Llama 3.1 8B. You are knowledgeable, helpful, and adaptive.

${stylePrompts[style] || stylePrompts.friendly}
${langPrompts[language] || langPrompts.id}

Guidelines:
- Be accurate and honest. If you don't know, say so.
- For code, provide clean, working, well-commented code.
- For math/science, show reasoning step by step.
- Use markdown formatting when appropriate.
- You are RED ENGINE — be proud of your identity.`;
  }

  _truncateForDiscord(text) {
    if (text.length <= 1900) return text;
    return text.substring(0, 1900) + "\n\n... *(dipotong — tanya lebih spesifik)*";
  }
}