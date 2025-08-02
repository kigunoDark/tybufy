const {
  generateThumbnails,
  createThumbnailPrompt,
  analyzeReferenceImage,
} = require("../services/dalle");
const User = require("../models/User");

const clearRateLimit = async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      error: "Only available in development mode",
    });
  }

  res.json({
    success: true,
    message: "Rate limit cleared for development",
  });
};

const generateThumbnailsHandler = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error:
          "Request body is missing. Please ensure you're sending JSON data with proper Content-Type header.",
        debug: {
          method: req.method,
          contentType: req.get("Content-Type"),
          hasBody: !!req.body,
        },
      });
    }

    const {
      mode,
      style,
      text,
      description,
      objectCount,
      referenceImageAnalysis,
    } = req.body;

    if (!mode) {
      return res.status(400).json({
        success: false,
        error: "Mode is required (styles or custom)",
      });
    }

    if (mode === "styles" && !style) {
      return res.status(400).json({
        success: false,
        error: "Style is required for styles mode",
      });
    }

    if (mode === "custom" && !description && !referenceImageAnalysis) {
      return res.status(400).json({
        success: false,
        error:
          "Description or reference image analysis is required for custom mode",
      });
    }

    const settings = {
      style,
      text,
      description,
      objectImages: Array(objectCount || 0).fill(null),
    };

    if (referenceImageAnalysis && mode === "custom") {
      settings.description = `${
        description || ""
      } Style reference: ${referenceImageAnalysis}`.trim();
    }

    const prompt = createThumbnailPrompt(settings, mode);

    const thumbnails = await generateThumbnails(prompt, 5);

    if (thumbnails.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate any thumbnails. Please try again.",
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "usage.thumbnailsGenerated": 1 },
    });

    res.json({
      success: true,
      message: `Generated ${thumbnails.length} thumbnail variants`,
      data: {
        thumbnails,
        prompt: prompt.substring(0, 200) + "...",
        settings: {
          mode,
          style,
          text,
          objectCount,
        },
      },
    });
  } catch (error) {
    if (
      error.message.includes("Rate limit") ||
      error.message.includes("rate limit")
    ) {
      return res.status(429).json({
        success: false,
        error:
          "AI service is currently busy. Please try again in a few minutes.",
      });
    }

    if (error.message.includes("Invalid prompt")) {
      return res.status(400).json({
        success: false,
        error:
          "The description contains inappropriate content or invalid parameters. Please try a different description.",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate thumbnails",
      debug:
        process.env.NODE_ENV === "development"
          ? {
              stack: error.stack,
              body: req.body,
              headers: req.headers,
            }
          : undefined,
    });
  }
};

const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const base64Image = req.file.buffer.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const analysis = await analyzeReferenceImage(imageUrl);

    res.json({
      success: true,
      data: {
        analysis,
        imageInfo: {
          filename: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze image",
    });
  }
};

const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("usage subscription");

    const limits = {
      free: { thumbnailsGenerated: 10 },
      pro: { thumbnailsGenerated: 100 },
      premium: { thumbnailsGenerated: -1 },
    };

    const userLimits = limits[user.subscription];
    const used = user.usage.thumbnailsGenerated || 0;

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        used: used,
        limit: userLimits.thumbnailsGenerated,
        remaining:
          userLimits.thumbnailsGenerated === -1
            ? -1
            : Math.max(0, userLimits.thumbnailsGenerated - used),
        unlimited: userLimits.thumbnailsGenerated === -1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get thumbnail statistics",
    });
  }
};

const processObjects = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No object images provided",
      });
    }

    const processedObjects = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        const sharp = require("sharp");
        const optimizedBuffer = await sharp(file.buffer)
          .resize(512, 512, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const base64 = optimizedBuffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        processedObjects.push({
          id: Date.now() + i,
          originalName: file.originalname,
          size: optimizedBuffer.length,
          dataUrl: dataUrl,
          optimized: true,
        });
      } catch (error) {
        continue;
      }
    }

    res.json({
      success: true,
      data: {
        objects: processedObjects,
        processed: processedObjects.length,
        total: req.files.length,
      },
    });
  } catch (error) {
    console.error("Object processing error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process object images",
    });
  }
};

const getStatus = async (req, res) => {
  try {
    const mongoose = require("mongoose");

    res.json({
      success: true,
      message: "Thumbnail API is working",
      timestamp: new Date().toISOString(),
      user: {
        id: req.user._id,
        email: req.user.email,
        subscription: req.user.subscription,
      },
      services: {
        dalle: !!process.env.OPENAI_API_KEY,
        mongodb: mongoose.connection.readyState === 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  clearRateLimit,
  generateThumbnailsHandler,
  analyzeImage,
  getStats,
  processObjects,
  getStatus,
};
