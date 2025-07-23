const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const { play } = require("elevenlabs");
const ElevenLabsClient = require("elevenlabs").ElevenLabsClient;
const dotenv = require("dotenv");

dotenv.config();

function webStreamToNodeStream(webStream) {
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      } catch (error) {
        console.error("❌ Ошибка чтения потока:", error.message);
        this.destroy(error);
      }
    }
  });
}

async function getAvailableVoices() {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return getDefaultVoices();
    }

    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    
    const response = await client.voices.getAll();
    
    if (!response.voices || !Array.isArray(response.voices)) {
      console.warn("⚠️ Неверный формат ответа от ElevenLabs, используем дефолтные голоса");
      return getDefaultVoices();
    }

    const formattedVoices = response.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'premade',
      description: voice.description || '',
      accent: voice.labels?.accent || '',
      age: voice.labels?.age || '',
      gender: voice.labels?.gender || '',
      use_case: voice.labels?.use_case || '',
      preview_url: voice.preview_url || null,
      settings: voice.settings || null
    }));
    
    return formattedVoices;

  } catch (error) {
    console.error("❌ Ошибка получения голосов:", error.message);
    
    return getDefaultVoices();
  }
}

function getDefaultVoices() {
  console.log("🔄 Используем дефолтные голоса");
  
  return [
    {
      voice_id: "JBFqnCBsd6RMkjVDRZzb",
      name: "George",
      category: "premade",
      description: "Middle aged American male",
      accent: "american",
      age: "middle_aged", 
      gender: "male",
      use_case: "narration",
      preview_url: null
    },
    {
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      name: "Rachel",
      category: "premade",
      description: "Young American female",
      accent: "american",
      age: "young",
      gender: "female", 
      use_case: "narration",
      preview_url: null
    },
    {
      voice_id: "AZnzlk1XvdvUeBnXmlld",
      name: "Domi",
      category: "premade",
      description: "Young American female", 
      accent: "american",
      age: "young",
      gender: "female",
      use_case: "narration",
      preview_url: null
    },
    {
      voice_id: "EXAVITQu4vr4xnSDxMaL",
      name: "Bella",
      category: "premade",
      description: "Young American female",
      accent: "american",
      age: "young",
      gender: "female",
      use_case: "narration", 
      preview_url: null
    }
  ];
}

async function generateAudio(text, voiceId = "JBFqnCBsd6RMkjVDRZzb") {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY не настроен");
    }

    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Текст для озвучки пустой");
    }
    if (text.length > 5000) {
      throw new Error("Текст слишком длинный для ElevenLabs (максимум ~5000 символов)");
    }

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text.trim(),
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true
      },
      output_format: "mp3_44100_128"
    });

    const timestamp = Date.now();
    const filename = `audio_${timestamp}.mp3`;
    const outputDir = path.join(__dirname, "../output");
    const outputPath = path.join(outputDir, filename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      if (audioStream instanceof ReadableStream) {
        const nodeStream = webStreamToNodeStream(audioStream);
        const chunks = [];
        
        nodeStream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        nodeStream.on('end', () => {
          const audioBuffer = Buffer.concat(chunks);
          
  
          fs.writeFileSync(outputPath, audioBuffer);
          
          resolve({
            audioData: audioBuffer.toString('base64'),
            audioUrl: `/output/${filename}`,
            filename: filename,
            size: audioBuffer.length,
            format: 'mp3',
            voiceId: voiceId,
            textLength: text.length,
            generatedAt: new Date().toISOString()
          });
        });
        
        nodeStream.on('error', (error) => {
          console.error("❌ Ошибка обработки аудио потока:", error);
          reject(new Error(`Ошибка обработки аудио: ${error.message}`));
        });
        
      } else if (Buffer.isBuffer(audioStream)) {
        fs.writeFileSync(outputPath, audioStream);
        
        console.log(`✅ Аудио сгенерировано: ${filename} (${audioStream.length} байт)`);
        
        resolve({
          audioData: audioStream.toString('base64'),
          audioUrl: `/output/${filename}`,
          filename: filename,
          size: audioStream.length,
          format: 'mp3',
          voiceId: voiceId,
          textLength: text.length,
          generatedAt: new Date().toISOString()
        });
        
      } else {
        reject(new Error("Неизвестный формат аудио потока"));
      }
    });

  } catch (error) {
    console.error("❌ Ошибка генерации аудио:", error);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error("Неверный API ключ ElevenLabs");
      } else if (status === 402) {
        throw new Error("Недостаточно кредитов ElevenLabs");
      } else if (status === 422) {
        throw new Error(`Ошибка валидации: ${data?.detail || 'Неверные параметры'}`);
      } else if (status === 429) {
        throw new Error("Превышен лимит запросов ElevenLabs");
      } else {
        throw new Error(`Ошибка ElevenLabs API: ${status} - ${data?.detail || error.message}`);
      }
    }
    
    throw new Error(`Ошибка генерации аудио: ${error.message}`);
  }
}

module.exports = { 
  generateAudio, 
  getAvailableVoices
};