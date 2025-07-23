// services/dalle.js - БЕЗ MOCK ДАННЫХ, ТОЛЬКО AI
const { OpenAI } = require("openai");

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is missing. Please add it to your .env file."
      );
    }

    // Проверяем формат API ключа
    if (!apiKey.startsWith('sk-')) {
      throw new Error("Invalid OpenAI API key format. Key should start with 'sk-'");
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  return openaiClient;
}

/**
 * Генерирует thumbnail с помощью DALL-E (ТОЛЬКО РЕАЛЬНАЯ ГЕНЕРАЦИЯ)
 * @param {string} prompt - Описание для генерации
 * @param {number} count - Количество изображений (1-5)
 * @param {string} size - Размер изображения
 * @param {string} quality - Качество изображения
 * @returns {Promise<Array>} Массив объектов с URL изображений
 */
async function generateThumbnails(
  prompt,
  count = 5,
  size = "1792x1024",
  quality = "hd"
) {

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "❌ OPENAI_API_KEY not found! Add it to .env file: OPENAI_API_KEY=sk-your-key"
    );
  }

  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    throw new Error(
      "❌ Invalid OpenAI API key format! Key should start with 'sk-'"
    );
  }

  let openai;
  try {
    openai = getOpenAIClient();
  } catch (error) {
    throw new Error(`❌ Failed to initialize OpenAI client: ${error.message}`);
  }

  const thumbnails = [];
  const errors = [];

  for (let i = 0; i < count; i++) {
    try {
      const variationPrompt = addPromptVariation(prompt, i);

      const startTime = Date.now();
      
      const singleResponse = await openai.images.generate({
        model: "dall-e-3",
        style: "natural",
        prompt: variationPrompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: "url",
      });

      const endTime = Date.now();

      if (singleResponse.data && singleResponse.data[0] && singleResponse.data[0].url) {
        thumbnails.push({
          id: i + 1,
          url: singleResponse.data[0].url,
          revised_prompt: singleResponse.data[0].revised_prompt || variationPrompt,
          created: new Date().toISOString(),
          isMock: false, 
          generationTime: endTime - startTime
        });

      } else {
        throw new Error(`No image data received from OpenAI for thumbnail ${i + 1}`);
      }

      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

    } catch (error) {


      if (error.response) {
        console.error(`📊 API Error Details:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }

      errors.push({
        imageIndex: i + 1,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      continue;
    }
  }

  // Проверяем результат
  if (thumbnails.length === 0) {
    const errorMessage = `❌ Failed to generate ANY thumbnails! Errors: ${errors.map(e => `Image ${e.imageIndex}: ${e.error}`).join('; ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (thumbnails.length < count) {
    console.warn(`⚠️ Generated only ${thumbnails.length}/${count} thumbnails. Errors: ${errors.length}`);
    errors.forEach(error => {
      console.warn(`❌ Image ${error.imageIndex}: ${error.error}`);
    });
  }
  
  return {
    thumbnails,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      requested: count,
      generated: thumbnails.length,
      failed: errors.length,
      allReal: true
    }
  };
}

function addPromptVariation(basePrompt, index) {
  const variations = [
    "",
    ", with dynamic lighting and vibrant colors",
    ", with creative composition and engaging visual elements",
    ", with professional photography style and sharp details",
    ", with cinematic atmosphere and striking visual impact",
  ];

  const colorVariations = [
    "",
    ", emphasizing warm color palette",
    ", emphasizing cool color palette",
    ", with high contrast and bold colors",
    ", with balanced and harmonious colors",
  ];

  const styleVariations = [
    "",
    ", digital art style",
    ", photorealistic style",
    ", modern graphic design style",
    ", creative artistic style",
  ];

  let modifiedPrompt = basePrompt;

  if (index > 0) {
    modifiedPrompt += variations[index] || variations[index % variations.length];

    if (index >= 2) {
      modifiedPrompt += colorVariations[index % colorVariations.length];
    }

    if (index >= 3) {
      modifiedPrompt += styleVariations[index % styleVariations.length];
    }
  }

  return modifiedPrompt;
}

function createThumbnailPrompt(settings, mode) {
  let prompt = "";
  let styleContext = "";

  if (mode === "styles" && settings.style) {
    const stylePrompts = {
      "youtube-gaming": function (settings) {
        let basePrompt = `Professional YouTube gaming thumbnail, 3D rendered style, photorealistic character models. `;
х
        if (settings.objectDescriptions && settings.objectDescriptions.length > 0) {
          basePrompt += `Characters: realistic 3D rendered human figures with detailed facial features, `;
          basePrompt += `positioned on right side of frame, dramatic character lighting. `;
        } else {
          basePrompt += `Main character: realistic 3D rendered person, detailed facial expression, `;
          basePrompt += `positioned center-right, professional 3D modeling quality like video game characters. `;
        }

        const dramaticLighting = [
          "dramatic green and red horror lighting like Outlast Trials, dark atmospheric background",
          "orange and yellow warm lighting like Elden Ring, fantasy mystical background", 
          "blue and purple mystical lighting, fantasy game environment",
          "red and orange action lighting, intense gaming atmosphere",
          "golden and brown warm lighting, adventure game style"
        ];
        const selectedLighting = dramaticLighting[Math.floor(Math.random() * dramaticLighting.length)];
        basePrompt += `Lighting: ${selectedLighting}. `;

        if (settings.text) {
          basePrompt += `TEXT - CRITICAL: Display "${settings.text}" as large 3D volumetric text with these exact specifications: `;
          basePrompt += `- Size: text takes 35-45% of image width, positioned on left side or bottom area `;
          basePrompt += `- Style: thick 3D extruded letters with depth and volume like movie titles `;
          basePrompt += `- Colors: bright yellow, white, or green with gradient effects `;
          basePrompt += `- Effects: strong drop shadows, 3D depth, metallic or glossy finish `;
          basePrompt += `- Readability: high contrast against background, easily readable at small sizes `;
          basePrompt += `- Quality: professional 3D text rendering like AAA video game logos. `;
        }

        basePrompt += `Technical specs: 16:9 aspect ratio, 1792x1024 resolution, `;
        basePrompt += `high-quality 3D rendering like Unreal Engine or Unity game graphics, `;
        basePrompt += `professional lighting setup, sharp details, high contrast for mobile viewing. `;

        basePrompt += `Rendering style: 3D computer graphics, video game quality renders, `;
        basePrompt += `NOT digital art, NOT painted style, NOT cartoon, NOT anime. `;
        basePrompt += `Think: AAA video game promotional materials, 3D character models, realistic game renders. `;

        basePrompt += `Composition: dramatic cinematic layout, rule of thirds, `;
        basePrompt += `character(s) on right, large text on left or bottom, `;
        basePrompt += `professional YouTube thumbnail optimization. `;

        basePrompt += `AVOID: flat 2D art, painting style, cartoon graphics, anime style, `;
        basePrompt += `abstract designs, low-poly models, sketch style, watercolor effects. `;
        return basePrompt;
      },

      "youtube-tech": "Clean tech review YouTube thumbnail with modern gadgets, blue and white color scheme (#00D4FF, #5B73DE, #9D50BB), minimalist design, professional layout with sleek devices, circuit patterns, or holographic elements",
      
      "youtube-tutorial": "Educational tutorial YouTube thumbnail with clear text layout, arrows pointing to important elements, step-by-step design, professional and informative style (#FF6B35, #F7931E, #FFD23F), charts or diagrams in background",
      
      "youtube-vlog": "Personal vlog YouTube thumbnail with warm pastel colors (#FF9A9E, #FECFEF), friendly atmosphere, lifestyle vibes, welcoming and personal feeling, soft lighting, cozy environment",
      
      "youtube-music": "Music video YouTube thumbnail with vibrant artistic colors (#A8EDEA, #FED6E3, #D299C2), musical elements like notes, instruments, sound waves, creative design with rhythm and energy, concert-like atmosphere",
      
      "youtube-fitness": "Fitness YouTube thumbnail with energetic red-orange colors (#FF416C, #FF4B2B, #FF8E53), dynamic poses, motivational design, strength and energy vibes, gym equipment or outdoor workout setting",
      
      "youtube-food": "Food YouTube thumbnail with appetizing warm colors (#FDBB2D, #22C1C3, #FF9472), delicious presentation, cozy kitchen vibes, mouth-watering appeal, steam effects, fresh ingredients",
      
      "youtube-business": "Professional business YouTube thumbnail with sophisticated colors (#667eea, #764ba2, #f093fb), charts, graphs, corporate style, success and achievement vibes, office environment or city skyline",
    };


    if (typeof stylePrompts[settings.style] === 'function') {
      styleContext = stylePrompts[settings.style](settings);
    } else {
      styleContext = stylePrompts[settings.style] || stylePrompts["youtube-gaming"](settings);
    }

    if (settings.styleDescription) {
      styleContext += `. Additional style notes: ${settings.styleDescription}`;
    }
  } else if (mode === "custom") {
    styleContext = `YouTube thumbnail: ${settings.description || "eye-catching and engaging design"}`;
  }

  prompt = styleContext;

  prompt += ". YouTube thumbnail optimized for maximum click-through rate: 16:9 aspect ratio (1280x720), high contrast for small preview size, attention-grabbing composition with rule of thirds, professional quality with sharp details, vibrant colors that pop on mobile screens, designed to stand out in YouTube feed";

  return prompt;
}

async function analyzeReferenceImage(imageUrl) {
  try {
    const openai = getOpenAIClient();
    console.log("🔍 Analyzing reference image...");

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and describe its style, colors, composition, and visual elements in detail. Focus on aspects that would be useful for creating a similar YouTube thumbnail design. Keep the description concise but comprehensive.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 200,
    });

    const description = response.choices[0]?.message?.content || "modern and engaging visual style";
    console.log("✅ Image analysis completed");
    return description;
  } catch (error) {
    console.error("❌ Image analysis error:", error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
}

async function testOpenAIConnection() {
  try {
    console.log("🧪 Testing OpenAI API connection...");
    const openai = getOpenAIClient();
    
    const models = await openai.models.list();
    console.log("✅ OpenAI API connection successful");
    
    return {
      success: true,
      message: "OpenAI API is working",
      availableModels: models.data.slice(0, 3).map(m => m.id)
    };
  } catch (error) {
    console.error("❌ OpenAI API connection failed:", error);
    throw new Error(`OpenAI API test failed: ${error.message}`);
  }
}

module.exports = {
  generateThumbnails,
  createThumbnailPrompt,
  analyzeReferenceImage,
  addPromptVariation,
  testOpenAIConnection,
};