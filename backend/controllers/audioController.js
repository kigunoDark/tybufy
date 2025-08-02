const { generateAudio, getAvailableVoices } = require("../services/openai-tts");
const User = require("../models/User");

const getVoices = async (req, res) => {
  try {
    const voices = await getAvailableVoices();

    res.json({
      success: true,
      data: { voices },
    });
  } catch (error) {
    console.error("Get voices error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get available voices",
    });
  }
};

const generateAudioHandler = async (req, res) => {
  const startTime = Date.now();

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error("❌ [VERCEL] Request timeout");
      res.status(408).json({
        success: false,
        error: "Request timeout. Text too long for processing.",
      });
    }
  }, 25000);

  try {
    const { text, voiceId } = req.body;

    if (!text) {
      clearTimeout(timeout);
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    const textLength = text.length;

    if (textLength > 8000) {
      clearTimeout(timeout);
      return res.status(413).json({
        success: false,
        error:
          "Text too long for Vercel processing. Please use text under 8000 characters.",
        textLength,
        maxLength: 8000,
      });
    }

    const audioResult = await generateAudio(text, voiceId);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "usage.audioGenerated": textLength },
    });

    const response = {
      success: true,
      message: audioResult.isChunked
        ? `Audio generated successfully in ${audioResult.totalChunks} parts`
        : "Audio generated successfully",
      data: audioResult,
      usage: {
        used: req.user.usage.audioGenerated + textLength,
        limit: req.user.getLimits().audioGenerated,
      },
      meta: {
        processingTime: Date.now() - startTime,
        platform: "vercel",
        textLength: audioResult.textLength,
        isFullText: !audioResult.wasTruncated,
        chunksGenerated: audioResult.totalChunks || 1,
      },
    };

    clearTimeout(timeout);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(response);
  } catch (error) {
    clearTimeout(timeout);
    const processingTime = Date.now() - startTime;
    console.error(`❌ [VERCEL] Error after ${processingTime}ms:`, error);

    if (res.headersSent) return;

    let statusCode = 500;
    let errorMessage = error.message || "Failed to generate audio";

    if (error.message.includes("timeout")) {
      statusCode = 408;
      errorMessage = "Request timeout. Try with shorter text.";
    } else if (error.message.includes("limit")) {
      statusCode = 429;
      errorMessage = "API rate limit exceeded. Please try again later.";
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      meta: { processingTime, platform: "vercel" },
    });
  }
};

module.exports = {
  getVoices,
  generateAudioHandler,
};
