// const { GoogleGenAI, Modality } = require("@google/genai");
// const fs = require("fs");
// const path = require("path");
// const crypto = require("crypto");

// class ThumbnailService {
//   constructor(apiKey) {
//     if (!apiKey) {
//       throw new Error("GEMINI_API_KEY is required");
//     }
    
//     this.genAI = new GoogleGenAI({ apiKey });
//     this.model = "gemini-2.0-flash-preview-image-generation";
//     this.outputDir = process.env.NODE_ENV === "development" ? "uploads/thumbnails" : "/tmp/thumbnails";
    
//     // Создаем директорию для сохранения файлов
//     this.ensureOutputDirectory();
//   }

//   /**
//    * Создает директорию для сохранения thumbnail'ов если её нет
//    */
//   ensureOutputDirectory() {
//     try {
//       if (!fs.existsSync(this.outputDir)) {
//         fs.mkdirSync(this.outputDir, { recursive: true });
//       }
//     } catch (error) {
//       console.warn(`⚠️ Could not create thumbnails directory: ${error.message}`);
//     }
//   }

//   /**
//    * Генерирует несколько вариантов thumbnail'ов
//    */
//   async generateThumbnails(options) {
//     const {
//       userQuery,
//       subjectImage,
//       referenceImage,
//       subjectPosition = "center",
//       transcriptText = "",
//       useLikeness = false,
//       aspectRatio = "16:9",
//       numberOfVariants = 3,
//       userId
//     } = options;

//     // Создаем различные стили промптов
//     const promptVariations = this.createPromptVariations(
//       userQuery, 
//       subjectPosition, 
//       transcriptText,
//       subjectImage
//     );

//     const results = [];
//     const maxVariants = Math.min(numberOfVariants, 3);

//     for (let i = 0; i < maxVariants; i++) {
//       try {
//         console.log(`🎨 Generating thumbnail ${i + 1}/${maxVariants}...`);
        
//         const promptData = promptVariations[i % promptVariations.length];
        
//         // Генерируем изображение через Gemini
//         const imageUrl = await this.generateSingleThumbnail(
//           promptData,
//           subjectImage,
//           referenceImage,
//           userId,
//           i + 1
//         );
        
//         results.push({
//           title: promptData.title,
//           imageUrl: imageUrl,
//           seed: this.generateSeed(),
//           prompt: promptData.prompt,
//           style: promptData.style,
//           generatedAt: new Date().toISOString()
//         });

//       } catch (error) {
//         console.error(`❌ Error generating thumbnail ${i + 1}:`, error);
        
//         results.push({
//           title: promptVariations[i % promptVariations.length].title,
//           imageUrl: null,
//           error: error.message,
//           seed: null
//         });
//       }

//       // Небольшая пауза между запросами
//       if (i < maxVariants - 1) {
//         await this.sleep(1000);
//       }
//     }

//     return results;
//   }

//   /**
//    * Генерирует одиночный thumbnail через Gemini API
//    */
//   async generateSingleThumbnail(promptData, subjectImage, referenceImage, userId, index) {
//     try {
//       // Подготавливаем контент для запроса
//       const contents = [];
      
//       // Добавляем текстовый промпт
//       contents.push({ text: promptData.prompt });
      
//       // Если есть изображение субъекта, добавляем его
//       if (subjectImage) {
//         const imageData = this.processImageInput(subjectImage);
//         contents.push({
//           inlineData: {
//             mimeType: imageData.mimeType,
//             data: imageData.data
//           }
//         });
//       }
      
//       // Если есть референсное изображение, добавляем его
//       if (referenceImage) {
//         const refImageData = this.processImageInput(referenceImage);
//         contents.push({
//           inlineData: {
//             mimeType: refImageData.mimeType,
//             data: refImageData.data
//           }
//         });
//       }

//       // Вызываем Gemini API
//       const response = await this.genAI.models.generateContent({
//         model: this.model,
//         contents: contents,
//         config: {
//           responseModalities: [Modality.TEXT, Modality.IMAGE]
//         }
//       });

//       // Обрабатываем ответ
//       if (!response.candidates || !response.candidates[0]) {
//         throw new Error("No candidates in response");
//       }

//       const candidate = response.candidates[0];
      
//       // Ищем изображение в ответе
//       for (const part of candidate.content.parts) {
//         if (part.inlineData && part.inlineData.data) {
//           // Сохраняем изображение
//           const fileName = await this.saveImage(part.inlineData.data, userId, index);
//           return fileName;
//         }
//       }

//       throw new Error("No image found in response");

//     } catch (error) {
//       console.error("Error in generateSingleThumbnail:", error);
//       throw error;
//     }
//   }

//   /**
//    * Обрабатывает входное изображение (URL или base64)
//    */
//   processImageInput(imageInput) {
//     if (!imageInput) return null;

//     // Если это base64 строка
//     if (imageInput.startsWith('data:image/')) {
//       const [header, data] = imageInput.split(',');
//       const mimeType = header.match(/data:([^;]+)/)[1];
//       return {
//         mimeType: mimeType,
//         data: data
//       };
//     }
    
//     // Если это просто base64 без заголовка
//     if (imageInput.match(/^[A-Za-z0-9+/=]+$/)) {
//       return {
//         mimeType: "image/png",
//         data: imageInput
//       };
//     }

//     // Если это URL - пока не поддерживаем, нужно было бы загрузить
//     throw new Error("URL images not supported yet. Please use base64 encoded images.");
//   }

//   /**
//    * Создает вариации промптов для разных стилей thumbnail'ов
//    */
//   createPromptVariations(userQuery, subjectPosition, transcriptText, hasSubjectImage) {
//     const basePrompts = [
//       {
//         title: "Драматичная реакция",
//         style: "dramatic",
//         prompt: `Create a YouTube thumbnail image with dramatic style. Topic: ${userQuery}. 
//                 Make it eye-catching with bold colors, dramatic lighting, and emotional expression. 
//                 Include large, readable text overlay. High contrast, vibrant colors. 
//                 ${hasSubjectImage ? `Position the main subject on the ${subjectPosition} side.` : ''}
//                 Style: dramatic, bold, attention-grabbing, YouTube thumbnail format.`
//       },
//       {
//         title: "Яркий и энергичный",
//         style: "vibrant",
//         prompt: `Generate a bright and energetic YouTube thumbnail image. Topic: ${userQuery}. 
//                 Use vibrant colors, dynamic composition, excited energy. Modern clean design with bold typography. 
//                 Make it colorful and attention-grabbing for social media. 
//                 ${hasSubjectImage ? `Place the main subject on the ${subjectPosition} side of the image.` : ''}
//                 Style: vibrant, energetic, colorful, modern YouTube thumbnail.`
//       },
//       {
//         title: "Профессиональный стиль",
//         style: "professional",
//         prompt: `Create a professional and clean YouTube thumbnail image. Topic: ${userQuery}. 
//                 Use clean design, balanced composition, professional lighting. Modern typography, premium quality look. 
//                 Sophisticated but still engaging and clickable. 
//                 ${hasSubjectImage ? `Position the subject on the ${subjectPosition} with professional lighting.` : ''}
//                 Style: professional, clean, modern, high-quality YouTube thumbnail.`
//       }
//     ];

//     // Добавляем контекст из transcript если есть
//     if (transcriptText && transcriptText.length > 10) {
//       basePrompts.forEach(promptObj => {
//         promptObj.prompt += ` Context from video: ${transcriptText.slice(0, 150)}.`;
//       });
//     }

//     return basePrompts;
//   }

//   /**
//    * Сохраняет сгенерированное изображение
//    */
//   async saveImage(base64Data, userId, index) {
//     try {
//       const buffer = Buffer.from(base64Data, "base64");
//       const timestamp = Date.now();
//       const random = crypto.randomBytes(4).toString("hex");
//       const fileName = `thumbnail_${userId}_${timestamp}_${index}_${random}.png`;
//       const filePath = path.join(this.outputDir, fileName);

//       fs.writeFileSync(filePath, buffer);
//       console.log(`💾 Saved thumbnail: ${fileName}`);

//       // Возвращаем URL для доступа к файлу
//       if (process.env.NODE_ENV === "development") {
//         return `/uploads/thumbnails/${fileName}`;
//       } else {
//         // В продакшене можно загружать в S3/CloudStorage
//         return `/tmp/thumbnails/${fileName}`;
//       }

//     } catch (error) {
//       console.error("Error saving image:", error);
//       throw new Error("Failed to save generated image");
//     }
//   }

//   /**
//    * Генерирует случайный seed
//    */
//   generateSeed() {
//     return Math.floor(Math.random() * 100000);
//   }

//   /**
//    * Пауза между запросами
//    */
//   async sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   /**
//    * Проверяет доступность сервиса
//    */
//   async healthCheck() {
//     try {
//       const testResponse = await this.genAI.models.generateContent({
//         model: this.model,
//         contents: [{ text: "Generate a simple test image of a blue circle" }],
//         config: {
//           responseModalities: [Modality.TEXT, Modality.IMAGE]
//         }
//       });

//       return {
//         status: "healthy",
//         timestamp: new Date().toISOString(),
//         model: this.model,
//         hasResponse: !!testResponse.candidates
//       };
//     } catch (error) {
//       return {
//         status: "unhealthy",
//         error: error.message,
//         timestamp: new Date().toISOString()
//       };
//     }
//   }
// }

// module.exports = ThumbnailService;