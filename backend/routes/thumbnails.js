// const express = require("express");
// const router = express.Router();
// const ThumbnailService = require("../services/simpleThumbnailService");
// const auth = require("../middleware/auth");

// // Middleware для проверки лимитов AI запросов (уже настроен в server.js)
// // Создаем инстанс сервиса
// const thumbnailService = new ThumbnailService(process.env.GEMINI_API_KEY);

// /**
//  * POST /api/thumbnails/generate
//  * Генерирует 3 варианта обложек для YouTube
//  */
// router.post("/generate", auth, async (req, res) => {
//   try {
//     const {
//       userQuery,
//       subjectImage, // base64 string или URL
//       referenceImage, // URL фонового изображения (опционально)
//       subjectPosition = "center",
//       transcriptText = "",
//       useLikeness = false,
//       aspectRatio = "16:9", // YouTube формат
//       numberOfVariants = 3
//     } = req.body;

//     // Валидация обязательных полей
//     if (!userQuery) {
//       return res.status(400).json({
//         success: false,
//         error: "userQuery is required"
//       });
//     }

//     if (userQuery.length > 480) {
//       return res.status(400).json({
//         success: false,
//         error: "userQuery must be less than 480 characters"
//       });
//     }

//     console.log(`🎨 Generating thumbnails for user: ${req.user.id}`);
//     console.log(`📝 Query: "${userQuery}"`);

//     // Генерируем thumbnail'ы
//     const thumbnails = await thumbnailService.generateThumbnails({
//       userQuery,
//       subjectImage,
//       referenceImage,
//       subjectPosition,
//       transcriptText,
//       useLikeness,
//       aspectRatio,
//       numberOfVariants,
//       userId: req.user.id
//     });

//     // Фильтруем успешные результаты
//     const successfulThumbnails = thumbnails.filter(thumb => !thumb.error);
//     const failedCount = thumbnails.length - successfulThumbnails.length;

//     if (successfulThumbnails.length === 0) {
//       return res.status(500).json({
//         success: false,
//         error: "Failed to generate any thumbnails",
//         details: thumbnails.map(t => t.error).filter(Boolean)
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         thumbnails: successfulThumbnails,
//         stats: {
//           requested: numberOfVariants,
//           generated: successfulThumbnails.length,
//           failed: failedCount
//         }
//       },
//       message: `Generated ${successfulThumbnails.length} thumbnail variants`
//     });

//   } catch (error) {
//     console.error("❌ Thumbnail generation error:", error);
    
//     res.status(500).json({
//       success: false,
//       error: "Failed to generate thumbnails",
//       details: process.env.NODE_ENV === "development" ? error.message : undefined
//     });
//   }
// });

// /**
//  * GET /api/thumbnails/test
//  * Тестовый эндпоинт для проверки работоспособности
//  */
// router.get("/test", async (req, res) => {
//   try {
//     const hasApiKey = !!process.env.GEMINI_API_KEY;
    
//     res.json({
//       success: true,
//       message: "Thumbnail service is ready",
//       config: {
//         hasApiKey,
//         supportedFormats: ["16:9", "1:1", "4:3", "3:4", "9:16"],
//         maxPromptLength: 480,
//         maxVariants: 4
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: "Service configuration error"
//     });
//   }
// });

// /**
//  * POST /api/thumbnails/quick-generate
//  * Быстрая генерация одного thumbnail'а для тестирования
//  */
// router.post("/quick-generate", auth, async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({
//         success: false,
//         error: "prompt is required"
//       });
//     }

//     console.log(`🚀 Quick generating thumbnail: "${prompt}"`);

//     const thumbnails = await thumbnailService.generateThumbnails({
//       userQuery: prompt,
//       numberOfVariants: 1,
//       userId: req.user.id
//     });

//     if (thumbnails[0]?.error) {
//       return res.status(500).json({
//         success: false,
//         error: thumbnails[0].error
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         thumbnail: thumbnails[0],
//         generatedAt: new Date().toISOString()
//       }
//     });

//   } catch (error) {
//     console.error("❌ Quick thumbnail generation error:", error);
    
//     res.status(500).json({
//       success: false,
//       error: "Failed to generate thumbnail"
//     });
//   }
// });

// module.exports = router;