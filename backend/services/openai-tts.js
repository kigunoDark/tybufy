const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getAvailableVoices() {
  return [
    {
      voice_id: "alloy",
      name: "Alloy",
      description: "Нейтральный голос",
      gender: "neutral",
      language: "multilingual",
    },
    {
      voice_id: "echo",
      name: "Echo",
      description: "Мужской голос",
      gender: "male",
      language: "multilingual",
    },
    {
      voice_id: "fable",
      name: "Fable",
      description: "Британский акцент",
      gender: "male",
      language: "multilingual",
    },
    {
      voice_id: "onyx",
      name: "Onyx",
      description: "Глубокий мужской голос",
      gender: "male",
      language: "multilingual",
    },
    {
      voice_id: "nova",
      name: "Nova",
      description: "Женский голос",
      gender: "female",
      language: "multilingual",
    },
    {
      voice_id: "shimmer",
      name: "Shimmer",
      description: "Женский голос",
      gender: "female",
      language: "multilingual",
    },
  ];
}

function validateVoice(voiceId) {
  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  return validVoices.includes(voiceId) ? voiceId : "nova";
}

function splitTextIntoChunks(text, maxChunkSize = 1800) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const potentialChunk = currentChunk + (currentChunk ? " " : "") + sentence;

    if (potentialChunk.length <= maxChunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      if (sentence.length > maxChunkSize) {
        const parts = sentence.split(/,\s+/);
        let tempChunk = "";

        for (const part of parts) {
          const potentialPart = tempChunk + (tempChunk ? ", " : "") + part;
          if (potentialPart.length <= maxChunkSize) {
            tempChunk = potentialPart;
          } else {
            if (tempChunk) chunks.push(tempChunk.trim());
            tempChunk = part;
          }
        }
        if (tempChunk) chunks.push(tempChunk.trim());
        currentChunk = "";
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

async function generateAudioChunk(text, voiceId, chunkIndex) {
  const startTime = Date.now();

  try {
    const validVoiceId = validateVoice(voiceId);
    const cleanText = text
      .trim()
      .replace(/\n\n+/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: validVoiceId,
      input: cleanText,
      response_format: "mp3",
      speed: 1.0,
    });

    const buffer = Buffer.from(await ttsResponse.arrayBuffer());
    const base64Audio = buffer.toString("base64");
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    const result = {
      audioUrl: dataUrl,
      audioBase64: base64Audio,
      filename: `audio_chunk_${chunkIndex + 1}_${Date.now()}.mp3`,
      size: buffer.length,
      format: "mp3",
      voiceId: validVoiceId,
      textLength: cleanText.length,
      chunkIndex,
      processingTime: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
      platform: "vercel",
      provider: "openai-tts",
      memoryOnly: true,
      fileSaved: false,
    };

    return result;
  } catch (error) {
    console.error(`❌ [CHUNK ${chunkIndex + 1}] Ошибка:`, error);
    throw new Error(`Chunk ${chunkIndex + 1} failed: ${error.message}`);
  }
}

async function generateAudio(text, voiceId = "nova") {
  const startTime = Date.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY не настроен");
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Текст для озвучки пустой");
    }

    const textLength = text.length;

    if (textLength <= 1800) {
      return await generateAudioChunk(text, voiceId, 0);
    } else {
      const chunks = splitTextIntoChunks(text, 1800);

      const audioChunks = [];
      let totalProcessingTime = 0;

      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunkResult = await generateAudioChunk(chunks[i], voiceId, i);
          audioChunks.push({
            ...chunkResult,
            chunkText:
              chunks[i].substring(0, 100) +
              (chunks[i].length > 100 ? "..." : ""),
          });

          totalProcessingTime += chunkResult.processingTime;

          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (chunkError) {
          console.error(`❌ [VERCEL] Ошибка части ${i + 1}:`, chunkError);
          throw new Error(
            `Не удалось сгенерировать часть ${i + 1}: ${chunkError.message}`
          );
        }
      }

      const result = {
        audioUrl: audioChunks[0].audioUrl,
        audioBase64: audioChunks[0].audioBase64,
        filename: `full_audio_${Date.now()}.mp3`,
        size: audioChunks.reduce((sum, chunk) => sum + chunk.size, 0),
        format: "mp3",
        voiceId: validateVoice(voiceId),
        textLength: textLength,
        originalTextLength: textLength,
        wasTruncated: false,
        generatedAt: new Date().toISOString(),
        processingTime: totalProcessingTime,
        platform: "vercel-chunked",
        provider: "openai-tts",
        isChunked: true,
        totalChunks: chunks.length,
        audioChunks: audioChunks,
        memoryOnly: true,
        fileSaved: false,
      };

      return result;
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [VERCEL] Общая ошибка за ${processingTime}ms:`, error);

    if (error.status === 400) {
      throw new Error(`Ошибка запроса OpenAI: ${error.message}`);
    } else if (error.status === 401) {
      throw new Error(`Неверный API ключ OpenAI: ${error.message}`);
    } else if (error.status === 429) {
      throw new Error(`Превышен лимит запросов OpenAI: ${error.message}`);
    } else if (error.status === 500) {
      throw new Error(`Ошибка сервера OpenAI: ${error.message}`);
    } else if (error.code === "FUNCTION_INVOCATION_TIMEOUT") {
      throw new Error(`Timeout на Vercel. Попробуйте сократить текст.`);
    }

    throw new Error(`OpenAI TTS запрос не удался: ${error.message}`);
  }
}

function getEnvironmentInfo() {
  const isVercel = !!process.env.VERCEL;
  const isLocal = !isVercel;

  return {
    platform: isVercel ? "vercel" : "local",
    isVercel,
    isLocal,
    region: process.env.VERCEL_REGION || "unknown",
    nodeVersion: process.version,
    memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || "unknown",
    maxChunkSize: 1800,
    supportsChunking: true,
  };
}

module.exports = {
  generateAudio,
  getAvailableVoices,
  getEnvironmentInfo,
};
