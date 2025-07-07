// generate-audio.js

const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const { play } = require("elevenlabs");
const ElevenLabsClient = require("elevenlabs").ElevenLabsClient;
const dotenv = require("dotenv");

dotenv.config();

// 🔁 Преобразует Web Stream в Node.js Readable
function webStreamToNodeStream(webStream) {
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null); // Завершаем поток
        } else {
          this.push(Buffer.from(value)); // Пушим данные
        }
      } catch (error) {
        console.error("❌ Ошибка чтения потока:", error.message);
      }
    }
  });
}


async function generateAudio(text, voiceId = "JBFqnCBsd6RMkjVDRZzb") {
  try {
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("❌ Текст для озвучки пустой");
    }
    if (text.length > 5000) {
      throw new Error(
        "❌ Текст слишком длинный для ElevenLabs (максимум ~5000 символов)"
      );
    }

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128"
    });



    const outputDir = path.join(__dirname, "../output");
    const outputPath = path.join(outputDir, "audio.mp3");

    if (audioStream instanceof ReadableStream) {
      // Преобразуем Web Stream в Node.js Readable
      const nodeStream = webStreamToNodeStream(audioStream);

      const writer = fs.createWriteStream(outputPath);
      nodeStream.pipe(writer);



    } else if (Buffer.isBuffer(audioStream)) {
      // Если вернулся Buffer
      fs.writeFileSync(outputPath, audioStream);
      return outputPath;
    } else {
      throw new Error("Неизвестный формат аудио");
    }
  } catch (error) {
    if (error.response) {
      console.error("🔍 Подробности ошибки:", {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

module.exports = { generateAudio };
